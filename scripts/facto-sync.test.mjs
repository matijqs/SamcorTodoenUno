import test from 'node:test';
import assert from 'node:assert/strict';
import { csvSkus, pacedFetch, buildSnapshot, saveSnapshot } from './facto-sync.mjs';
import { createStockReader, FactoError } from './facto-stock.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const instant = Date.parse('2026-10-21T12:00:00Z');
const now = () => instant;
const item = (sku, available = 8) => ({ sku, available, checkedAt: new Date(instant).toISOString() });

test('CSV conserva ceros, deduplica y acepta BOM, comillas y descripciones multilínea', () => {
  const csv = '\uFEFFCODIGO;DESCRIPCION;WEB\r\n001;"Llanta; ""A""\nsegunda línea";1\r\n001;Otra;2\r\n002;Otra;3\r\n';
  assert.deepEqual(csvSkus(csv), ['001', '002']);
  for (const invalid of ['SKU;DESCRIPCION\nA;N', 'CODIGO;CODIGO\nA;B',
    'CODIGO;DESCRIPCION\n;neumático', 'CODIGO;DESCRIPCION\nA;"sin cerrar']) {
    assert.throws(() => csvSkus(invalid), FactoError);
  }
});

test('sesión reutiliza token entre productos y lo renueva antes de caducar', async () => {
  let time = instant, authentications = 0, currentSku;
  const reader = createStockReader({
    credentials: {}, now: () => time,
    fetchImpl: async url => {
      if (url.endsWith('/auth')) {
        authentications++;
        return Response.json({ access_token: 'PRIVATE-TOKEN', expires_in: 3600 });
      }
      if (url.includes('/products?')) {
        currentSku = new URL(url).searchParams.get('sku');
        return Response.json({ outer: { products: [{ product_id: 7, sku: currentSku }] } });
      }
      return Response.json({ outer: { product_id: 7, sku: currentSku, inventories: { total_available: 8 } } });
    },
  });
  await reader('001'); await reader('002');
  assert.equal(authentications, 1);
  time += 3600 * 1000;
  await reader('003');
  assert.equal(authentications, 2);
});

test('snapshot solo publica campos permitidos y distingue cero de consulta fallida', async () => {
  const snapshot = await buildSnapshot({
    skus: ['A', 'B', 'C'], now,
    readStock: async sku => {
      if (sku === 'B') throw new Error('PRIVATE-PASSWORD');
      return { ...item(sku, sku === 'A' ? 0 : 8), token: 'PRIVATE-TOKEN', account: 'PRIVATE-ACCOUNT' };
    },
  });
  assert.equal(snapshot.status, 'partial');
  assert.equal(snapshot.verified, 2);
  assert.equal(snapshot.products[0].available, 0);
  assert.equal(snapshot.products[1].available, null);
  assert.equal(snapshot.products[1].status, 'unverified');
  assert.ok(!JSON.stringify(snapshot).includes('PRIVATE'));
});

test('no omite productos posteriores a cinco SKU inexistentes', async () => {
  const snapshot = await buildSnapshot({
    skus: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], now,
    readStock: async sku => {
      if (sku !== 'G') throw new FactoError('Sin coincidencia');
      return item(sku);
    },
  });
  assert.equal(snapshot.verified, 1);
  assert.equal(snapshot.products.at(-1).available, 8);
});

test('un fallo global no genera snapshot que reemplace datos anteriores', async () => {
  let calls = 0;
  await assert.rejects(buildSnapshot({
    skus: ['A', 'B'], now,
    readStock: async () => { calls++; throw new FactoError('Acceso denegado', 403); },
  }), /Se conserva el archivo anterior/);
  assert.equal(calls, 1);
});

test('agotado el tiempo o el límite de API, lo pendiente queda sin verificar', async () => {
  let calls = 0;
  const result = await buildSnapshot({
    skus: ['A', 'B', 'C'], now,
    readStock: async sku => { calls++; if (sku === 'B') throw new FactoError('Límite', 429); return item(sku); },
  });
  assert.equal(calls, 2);
  assert.equal(result.products[2].status, 'unverified');
  let time = instant;
  const timed = await buildSnapshot({
    skus: ['A', 'B'], now: () => time, maxDurationMs: 1000,
    readStock: async sku => { time += 2000; return item(sku); },
  });
  assert.equal(timed.products[1].available, null);
});

test('rate limit respeta espera mínima, Retry-After y un timeout nuevo', async () => {
  const waits = [], signals = [];
  let calls = 0;
  const fetchImpl = pacedFetch({
    spacingMs: 1000, sleep: async ms => waits.push(ms),
    fetchImpl: async (_, options) => {
      signals.push(options.signal);
      calls++;
      return calls < 3 ? new Response('', { status: 429, headers: { 'retry-after': '45' } }) : Response.json({});
    },
  });
  assert.equal((await fetchImpl('https://example.invalid', {})).status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [45000, 1000, 60000, 1000]);
  assert.notEqual(signals[0], signals[1]);
});

test('no reintenta bloqueos ni ignora Retry-After demasiado largo', async () => {
  for (const status of [403, 429]) {
    let calls = 0;
    const client = pacedFetch({ sleep: async () => {}, fetchImpl: async () => {
      calls++; return new Response('', { status, headers: { 'retry-after': '600' } });
    } });
    assert.equal((await client('https://example.invalid', {})).status, status);
    assert.equal(calls, 1);
  }
});

test('guardado produce JSON completo en el archivo final', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'samcor-stock-'));
  try {
    const snapshot = await buildSnapshot({ skus: ['A'], now, readStock: async sku => item(sku) });
    const path = join(dir, 'stock.json');
    await saveSnapshot(path, snapshot);
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), snapshot);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

