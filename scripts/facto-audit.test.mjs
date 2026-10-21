import test from 'node:test';
import assert from 'node:assert/strict';
import { audit, describeInventory } from './facto-audit.mjs';
const sku = '1556513ROADH11';
const inventory = {
  total_available: 0, total_reserved: 0,
  details: [
    { product_location_id: 'PRIVATE-ID-1', available_quantity: 2, reserved_quantity: 0 },
    { product_location_id: 'PRIVATE-ID-2', available_quantity: '3', reserved_quantity: 0 },
  ],
  secret: 'PRIVATE-SECRET',
};
test('compara total cero con cinco en bodegas sin cambiarlo ni sumar dos veces', async () => {
  const calls = [];
  const responses = [
    { access_token: 'PRIVATE-TOKEN' },
    { wrapper: { products: [{ sku, product_id: 7 }] } },
    { metadata: { secret: 'PRIVATE' }, wrapper: { product_id: 7, sku, inventories: inventory, prices: 'PRIVATE' } },
  ];
  const message = await audit({
    credentials: {}, sku, expected: 5,
    fetchImpl: async (url, options) => { calls.push({ url, method: options.method });return Response.json(responses.shift()); },
  });
  assert.match(message, /Cantidad leída por el cotizador: 0/);
  assert.match(message, /Suma diagnóstica de available_quantity: 5/);
  assert.match(message, /Total y suma del detalle coinciden: NO/);
  assert.ok(!message.includes('PRIVATE'));
  assert.deepEqual(calls.map(x => x.method), ['POST', 'GET', 'GET']);
});
test('detalles vacíos o cantidades ausentes no se interpretan como cero', () => {
  for (const details of [[], null, [{ available_quantity: null }]]) {
    assert.match(describeInventory({ total_available: 0, details }).join('\n'),
      /Suma diagnóstica de available_quantity: ausente o inválido/);
  }
});
test('detecta IDs repetidos y permite inspeccionar un mapa de bodegas', () => {
  const repeated = { ...inventory, details: [inventory.details[0], inventory.details[0]] };
  assert.match(describeInventory(repeated).join('\n'), /sin duplicados: no/);
  const mapped = { ...inventory, details: { PRIVATE_A: inventory.details[0], PRIVATE_B: inventory.details[1] } };
  const message = describeInventory(mapped).join('\n');
  assert.match(message, /Formato de details: objeto/);
  assert.match(message, /Suma diagnóstica de available_quantity: 5/);
  assert.ok(!message.includes('PRIVATE'));
});
test('valores inválidos no se convierten a números ni se imprimen', () => {
  const message = describeInventory({ total_available: 'PRIVATE', total_reserved: false,
    details: [{ product_location_id: 'PRIVATE', available_quantity: '', reserved_quantity: 'PRIVATE' }] }).join('\n');
  assert.match(message, /total_available: ausente o inválido/);
  assert.ok(!message.includes('PRIVATE'));
});
test('rechaza referencias inválidas antes de consultar', async () => {
  for (const expected of ['', null, false, -1, 'PRIVATE']) {
    await assert.rejects(audit({ credentials: {}, sku, expected, fetchImpl: () => {throw Error('No debía consultar');} }), /referencia/);
  }
});
test('no aprueba ni publica el detalle de otro SKU', async () => {
  const responses = [
    { access_token: 'PRIVATE-TOKEN' }, [{ sku, product_id: 7 }],
    { product_id: 7, sku: 'OTRO', inventories: inventory },
  ];
  await assert.rejects(audit({ credentials: {}, sku, expected: 5,
    fetchImpl: async () => Response.json(responses.shift()) }), /no corresponde/);
});

