import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import '../Webprecios/stock-facto.js';

const { parseSnapshot, stockView, quantityFor, summary } = globalThis.SamcorStock;
const now = Date.parse('2026-10-21T12:00:00Z');
const fixture = (available, checkedAt = new Date(now).toISOString()) => ({
  schemaVersion: 1, generatedAt: new Date(now).toISOString(), status: 'complete',
  products: [{ sku: 'A', status: 'ok', available, checkedAt }],
});

test('stock suficiente, insuficiente, cero y negativo se distinguen', () => {
  for (const [amount, expected] of [[8, 'ok'], [2, 'low'], [0, 'empty'], [-1, 'empty']]) {
    const snapshot = parseSnapshot(fixture(amount), now);
    assert.equal(stockView(snapshot, 'A', 4, now).tone, expected);
  }
  assert.equal(stockView(parseSnapshot(fixture(2), now), 'A', 2, now).tone, 'ok');
  assert.deepEqual(['WEB', 'X 2 EFEC', 'X 4 TC', 'X 4 EFEC'].map(quantityFor), [1, 2, 4, 4]);
});

test('nulo, SKU ausente y fecha futura no se convierten en cero ni disponible', () => {
  const snapshot = parseSnapshot(fixture(null), now);
  assert.equal(stockView(snapshot, 'A', 4, now).text, 'Stock sin verificar');
  assert.equal(stockView(snapshot, 'B', 4, now).tone, 'unknown');
  const future = parseSnapshot(fixture(10, new Date(now + 86400000).toISOString()), now);
  assert.equal(stockView(future, 'A', 4, now).tone, 'unknown');
});

test('stock anterior a 36 horas se identifica como antiguo', () => {
  const snapshot = parseSnapshot(fixture(8, new Date(now - 37 * 3600000).toISOString()), now);
  assert.equal(stockView(snapshot, 'A', 4, now).tone, 'unknown');
  assert.match(stockView(snapshot, 'A', 4, now).text, /desactualizado/);
});

test('snapshot malformado o con SKU duplicado se rechaza', () => {
  assert.throws(() => parseSnapshot({ products: [] }, now));
  const duplicate = fixture(8);
  duplicate.products.push(duplicate.products[0]);
  assert.throws(() => parseSnapshot(duplicate, now), /duplicado/);
  assert.equal(stockView(null, 'A', 4, now).tone, 'unknown');
  assert.match(summary(null), /sin verificar/);
});

// Ejecutar los handlers reales con un DOM mínimo que contiene stock visible.
// Si vuelven a copiar innerText de toda la tarjeta, estas pruebas fallan.
async function copyHarness(selected) {
  const listeners = new Map(), copied = [];
  const cards = ['🔥 Producto A: *$110.000* los 4', '🔥 Producto B: *$130.000* los 4'].map(text => ({
    dataset: { textoCopia: text }, innerText: text + '\nStock registrado: 8 u · Alcanza para 4',
  }));
  const results = {
    querySelector: selector => selector === 'h3' ? { innerText: 'Tenemos lo siguiente:' }
      : { dataset: { textoCopia: 'Incluye instalación.' } },
    querySelectorAll: selector => selector === '.alert-info' ? cards
      : selected.map(index => ({ closest: () => cards[index] })),
  };
  const nodes = new Map();
  const document = { getElementById: id => {
    if (id === 'resultados') return results;
    if (id === 'texto-bajadas') return { dataset: { textoCopia: 'Incluye instalación.' } };
    if (!nodes.has(id)) nodes.set(id, { addEventListener: (type, fn) => listeners.set(id + ':' + type, fn) });
    return nodes.get(id);
  } };
  const context = vm.createContext({ document, navigator: { clipboard: { writeText: text => copied.push(text) } },
    setInterval: () => 0, alert: () => {}, console });
  vm.runInContext(await readFile(new URL('../Webprecios/script.js', import.meta.url), 'utf8'), context);
  return { listeners, copied };
}

test('Copiar Todo usa las cotizaciones y excluye el stock visible', async () => {
  const { listeners, copied } = await copyHarness([]);
  listeners.get('copyButton:click')();
  assert.equal(copied[0], 'Tenemos lo siguiente:\n\n🔥 Producto A: *$110.000* los 4\n\n🔥 Producto B: *$130.000* los 4\n\nIncluye instalación.');
});

test('Copiar Seleccionados excluye stock y productos no elegidos', async () => {
  const { listeners, copied } = await copyHarness([1]);
  listeners.get('copySelectedButton:click')();
  assert.equal(copied[0], 'Tenemos lo siguiente:\n\n🔥 Producto B: *$130.000* los 4\n\nIncluye instalación.');
});

