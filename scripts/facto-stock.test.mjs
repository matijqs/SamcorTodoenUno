import test from 'node:test';
import assert from 'node:assert/strict';
import { credentialsFromEnv, readStock, runProbe } from './facto-stock.mjs';

const env = {
  FACTO_CLIENT_ID: 'test-client',
  FACTO_CLIENT_SECRET: 'test-secret',
  FACTO_USERNAME: 'test-user',
  FACTO_PASSWORD: 'test-password',
  FACTO_TEST_SKU: 'SKU-001',
};
const credentials = credentialsFromEnv(env);
const auth = { access_token: 'test-token' };
const listing = [{ sku: 'SKU-001', product_id: 7 }];
const detail = total => ({
  product_id: 7, sku: 'SKU-001',
  inventories: { total_available: total, total_reserved: 3,
    details: [{ available_quantity: 2 }, { available_quantity: 6 }] },
});

function mockFetch(responses) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, ...options });
    const next = responses.shift();
    assert.notEqual(next, undefined, 'No se esperaban más llamadas');
    if (next instanceof Error) throw next;
    return next instanceof Response ? next : Response.json(next);
  };
  return { calls, fetchImpl };
}

test('autentica una vez, busca por SKU y conserva el total sin duplicar bodegas ni restar reservas', async () => {
  const mock = mockFetch([auth, listing, detail(8)]);
  const result = await readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock });
  assert.equal(result.available, 8);
  assert.equal(result.sku, env.FACTO_TEST_SKU);
  assert.ok(Number.isFinite(Date.parse(result.checkedAt)));
  assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
    ['POST', 'https://apifacto.com/v1/auth'],
    ['GET', 'https://apifacto.com/v1/products?sku=SKU-001'],
    ['GET', 'https://apifacto.com/v1/products/7'],
  ]);
  assert.deepEqual(JSON.parse(mock.calls[0].body), { grant_type: 'password', ...credentials });
  for (const call of mock.calls) {
    assert.equal(call.redirect, 'error');
    assert.ok(call.signal instanceof AbortSignal);
  }
  assert.equal(mock.calls[1].headers.Authorization, 'Bearer test-token');
  assert.equal(mock.calls[2].headers.Authorization, 'Bearer test-token');
});

test('cero es válido, cadenas numéricas se interpretan y valores negativos se conservan', async () => {
  for (const value of [0, '0', '12', -2]) {
    const mock = mockFetch([auth, listing, detail(value)]);
    const result = await readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock });
    assert.equal(result.available, Number(value));
  }
});

test('stock ausente o inválido nunca se convierte en cero', async () => {
  for (const value of [null, undefined, '', ' ', true, [], {}, 'NaN', '12abc', '1,000']) {
    const mock = mockFetch([auth, listing, detail(value)]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /stock total válido/);
  }
});

test('SKU inexistente, parcial o duplicado falla antes de consultar el detalle', async () => {
  for (const products of [[], [{ sku: 'SKU-001-X', product_id: 7 }], [...listing, ...listing]]) {
    const mock = mockFetch([auth, products]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /Stock sin verificar/);
    assert.equal(mock.calls.length, 2);
  }
});

test('el ID debe ser seguro y el detalle debe pertenecer al producto buscado', async () => {
  for (const id of ['../auth', 0, null, -1]) {
    const mock = mockFetch([auth, [{ sku: 'SKU-001', product_id: id }]]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /identificador/);
  }
  for (const product of [{ ...detail(8), sku: 'OTRO' }, { ...detail(8), product_id: 9 }]) {
    const mock = mockFetch([auth, listing, product]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /no corresponde/);
  }
});

test('codifica el SKU en la URL sin convertirlo en parámetros adicionales', async () => {
  const sku = 'A&B/+ 001';
  const mock = mockFetch([auth, [{ sku, product_id: 7 }], { ...detail(8), sku }]);
  await readStock({ credentials, sku, ...mock });
  const params = new URL(mock.calls[1].url).searchParams;
  assert.equal(params.get('sku'), sku);
  assert.equal(params.size, 1);
});

test('faltan credenciales o SKU: no inicia ninguna solicitud', async () => {
  for (const missing of Object.keys(env)) {
    const mock = mockFetch([]);
    const output = [];
    const code = await runProbe({ env: { ...env, [missing]: '' }, ...mock, log: m => output.push(m) });
    assert.equal(code, 1);
    assert.equal(mock.calls.length, 0);
  }
});

test('rechaza token ausente y formatos inesperados sin registrar respuestas', async () => {
  for (const responses of [[{ access_token: '' }], [auth, { unknown_collection: listing }],
    [new Response('secreto-de-prueba', { status: 200 })]]) {
    const mock = mockFetch(responses);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.ok(!output.join('').includes('secreto-de-prueba'));
  }
});

test('HTTP 401, 402, 403, 404, 429 y 500 terminan sin reintentos ni cuerpos sensibles', async () => {
  for (const status of [401, 402, 403, 404, 429, 500]) {
    const mock = mockFetch([auth, new Response('test-password test-secret', { status })]);
    const output = [];
    const summary = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m), summary: async m => summary.push(m) }), 1);
    assert.equal(mock.calls.length, 2);
    assert.deepEqual(output, summary);
    assert.ok(!output.join('').includes('test-password'));
    assert.ok(!output.join('').includes('test-secret'));
    if (status === 403) assert.ok(!output.join('').includes('pago'));
  }
});

test('fallos de red o timeout no filtran el mensaje original', async () => {
  for (const name of ['TypeError', 'TimeoutError']) {
    const error = new Error('test-password test-token');
    error.name = name;
    const output = [];
    const mock = mockFetch([error]);
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.match(output[0], /No se pudo contactar/);
    assert.ok(!output[0].includes('test-password'));
    assert.ok(!output[0].includes('test-token'));
  }
});

test('un resultado correcto no publica stock, SKU, token ni credenciales en logs o resumen', async () => {
  const mock = mockFetch([auth, listing, detail(98765)]);
  const output = [];
  const summary = [];
  assert.equal(await runProbe({ env, ...mock, log: m => output.push(m), summary: async m => summary.push(m) }), 0);
  assert.deepEqual(output, summary);
  for (const secret of [...Object.values(env), 'test-token', '98765']) {
    assert.ok(!output.join('').includes(secret));
  }
});

test('HTTP 400 identifica la etapa exacta sin exponer SKU ni ID', async () => {
  const scenarios = [
    { prior: [], stage: 'Autenticación (POST /auth)' },
    { prior: [auth], stage: 'Búsqueda por SKU (GET /products)' },
    { prior: [auth, listing], stage: 'Lectura de inventario (GET /products/{id})' },
  ];
  for (const { prior, stage } of scenarios) {
    const mock = mockFetch([...prior, new Response('respuesta privada test-secret', { status: 400 })]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.ok(output[0].startsWith(stage));
    assert.ok(!output[0].includes('SKU-001'));
    assert.ok(!output[0].includes('test-secret'));
    assert.ok(!output[0].includes('respuesta privada'));
    assert.equal(mock.calls.length, prior.length + 1);
  }
});

test('solo muestra códigos OAuth conocidos y omite descripciones privadas', async () => {
  for (const code of ['invalid_client', 'invalid_grant', 'invalid_request',
    'unsupported_grant_type', 'unauthorized_client', 'invalid_scope']) {
    const mock = mockFetch([Response.json({ error: code, error_description: 'test-password test-token' }, { status: 400 })]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.ok(output[0].includes(code));
    assert.ok(!output[0].includes('test-password'));
    assert.ok(!output[0].includes('test-token'));
  }
});

test('códigos arbitrarios, objetos y nombres heredados nunca se reflejan en el log', async () => {
  for (const error of ['test-secret', 'constructor', 'toString', '__proto__', { code: 'test-password' }]) {
    const mock = mockFetch([Response.json({ error, message: 'test-password', error_description: 'test-token' }, { status: 400 })]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    for (const value of ['test-secret', 'constructor', 'toString', '__proto__', 'test-password', 'test-token']) {
      assert.ok(!output[0].includes(value));
    }
  }
});

test('diagnóstico de estructura distingue envoltorios sin aceptar datos no documentados', async () => {
  for (const body of [{ data: listing }, { unknown_collection: listing },
    { data: { items: listing } }, { error: 'PRIVATE', message: 'PRIVATE' }, null, 'PRIVATE']) {
    const mock = mockFetch([auth, body]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.match(output[0], /Estructura recibida \(solo tipos\):/);
    assert.equal(mock.calls.length, 2);
    for (const secret of ['PRIVATE', ...Object.values(env), 'test-token']) {
      assert.ok(!output[0].includes(secret));
    }
  }
});

test('diagnóstico omite claves desconocidas y limita profundidad sin filtrar valores', async () => {
  const body = { data: [{ sku: 'PRIVATE-SKU', product_id: 987654321,
    'PRIVATE-KEY': 'PRIVATE-VALUE', inventories: { total_available: 987654321 } }],
    message: 'PRIVATE-MESSAGE', 'PRIVATE-ROOT': 'PRIVATE-VALUE' };
  const mock = mockFetch([auth, body]);
  const output = [];
  const summary = [];
  assert.equal(await runProbe({ env, ...mock, log: m => output.push(m), summary: async m => summary.push(m) }), 1);
  assert.deepEqual(output, summary);
  assert.match(output[0], /data: lista<objeto\{/);
  assert.match(output[0], /sku: string/);
  assert.match(output[0], /product_id: number/);
  assert.match(output[0], /otros campos omitidos/);
  assert.ok(!output[0].includes('PRIVATE'));
  assert.ok(!output[0].includes('987654321'));
});


test('expone tipos bajo claves desconocidas sin revelar nombres ni valores', async () => {
  for (const key of ['987654321', 'PRIVATE-COLLECTION']) {
    const mock = mockFetch([auth, { [key]: { product_id: 987654321, sku: 'PRIVATE-SKU' } }]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.match(output[0], /clave (numerica|de texto) oculta: objeto/);
    assert.match(output[0], /product_id: number/);
    assert.match(output[0], /sku: string/);
    assert.ok(!output[0].includes('987654321'));
    assert.ok(!output[0].includes('PRIVATE'));
    assert.equal(mock.calls.length, 2);
  }
});

test('un envoltorio desconocido revela solo estructura anidada y permanece rechazado', async () => {
  const mock = mockFetch([auth, { 'PRIVATE-WRAPPER': { 'PRIVATE-KEY': listing } }]);
  const output = [];
  assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
  assert.match(output[0], /lista<objeto/);
  assert.match(output[0], /sku: string/);
  assert.ok(!output[0].includes('PRIVATE'));
  assert.ok(!output[0].includes('SKU-001'));
});

test('diagnóstico limita profundidad, anchura y presupuesto de nodos', async () => {
  const wide = Object.fromEntries(Array.from({length: 1000}, (_, i) => ['PRIVATE-' + i, { sku: 'PRIVATE' }]));
  const deepBody = { data: { data: { data: { data: { data: { sku: 'PRIVATE' } } } } } };
  for (const body of [wide, deepBody]) {
    const mock = mockFetch([auth, body]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.ok(output[0].length < 4000);
    assert.ok(!output[0].includes('PRIVATE'));
  }
});

test('diagnóstico de detalle e inventario protege valores privados', async () => {
  for (const body of [{ 'PRIVATE': { ...detail(987654321), sku: 'PRIVATE-WRONG-SKU' } }, { ...detail(null), inventories: { 'PRIVATE': 987654321 } }]) {
    const mock = mockFetch([auth, listing, body]);
    const output = [];
    assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 1);
    assert.match(output[0], /Estructura/);
    assert.ok(!output[0].includes('PRIVATE'));
    assert.ok(!output[0].includes('987654321'));
    assert.ok(!output[0].includes('SKU-001'));
  }
});



const envelope = value => ({
  PRIVATE_METADATA: { PRIVATE_HEADER_A: { PRIVATE_VALUE: 'PRIVATE' },
    PRIVATE_HEADER_B: { PRIVATE_VALUE: 'PRIVATE' } },
  PRIVATE_PAYLOAD: value,
});

test('lee la estructura observada: metadatos y contenedor con products', async () => {
  const mock = mockFetch([auth, envelope({ products: listing }), detail(8)]);
  const result = await readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock });
  assert.equal(result.available, 8);
  assert.equal(mock.calls.length, 3);
  assert.equal(mock.calls[2].url, 'https://apifacto.com/v1/products/7');
});

test('acepta listado directo, products en raíz y products dentro de un contenedor', async () => {
  for (const response of [listing, { products: listing }, envelope({ products: listing })]) {
    const mock = mockFetch([auth, response, detail(0)]);
    const result = await readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock });
    assert.equal(result.available, 0);
  }
});

test('rechaza listas ambiguas, SKU duplicados y listas vacías sin consultar detalle', async () => {
  for (const response of [
    { first: { products: listing }, second: { products: listing } },
    { products: listing, second: { products: listing } },
    envelope({ products: [...listing, ...listing] }),
    envelope({ products: [] }),
  ]) {
    const mock = mockFetch([auth, response]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /Stock sin verificar/);
    assert.equal(mock.calls.length, 2);
  }
});

test('el envoltorio no permite IDs inseguros ni stock de otro SKU', async () => {
  const unsafe = mockFetch([auth, envelope({ products: [{ sku: env.FACTO_TEST_SKU, product_id: '../auth' }] })]);
  await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...unsafe }), /identificador/);
  assert.equal(unsafe.calls.length, 2);
  for (const changed of [{ ...detail(8), sku: 'OTRO' }, { ...detail(8), product_id: 9 }]) {
    const mock = mockFetch([auth, envelope({ products: listing }), envelope({ product: changed })]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /no corresponde/);
  }
});

test('extrae un único detalle del contenedor y conserva el stock total', async () => {
  for (const response of [
    detail(8), envelope(detail(8)), envelope({ product: detail(8) }),
    envelope({ products: [detail(8)] }), { product: detail(8) },
  ]) {
    const mock = mockFetch([auth, envelope({ products: listing }), response]);
    assert.equal((await readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock })).available, 8);
  }
});

test('rechaza detalles múltiples o inválidos y stock ausente', async () => {
  for (const response of [
    envelope({ products: [detail(8), detail(9)] }),
    { first: detail(8), second: detail(8) },
    envelope({ product: { ...detail(8), inventories: {} } }),
    envelope({ products: [] }),
    envelope({ product: JSON.stringify(detail(8)) }),
  ]) {
    const mock = mockFetch([auth, listing, response]);
    await assert.rejects(readStock({ credentials, sku: env.FACTO_TEST_SKU, ...mock }), /Stock sin verificar/);
  }
});

test('la conexión con envoltorios no publica metadatos, SKU ni cantidades', async () => {
  const mock = mockFetch([auth, envelope({ products: listing }), envelope({ product: detail(987654321) })]);
  const output = [];
  assert.equal(await runProbe({ env, ...mock, log: m => output.push(m) }), 0);
  for (const value of ['PRIVATE', '987654321', ...Object.values(env), 'test-token']) {
    assert.ok(!output[0].includes(value));
  }
});


