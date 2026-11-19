import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = path.join(root, 'Webprecios', 'files');
const csv = fs.readFileSync(path.join(files, 'stock-bodega.csv'), 'utf8').replace(/^\uFEFF/, '');
const stock = JSON.parse(fs.readFileSync(path.join(files, 'stock-facto.json'), 'utf8'));
const routes = JSON.parse(fs.readFileSync(path.join(root, 'bot', 'llantas-rutas.json'), 'utf8'));
const output = path.join(files, 'bot-index.json');

const rows = csv.trim().split(/\r?\n/);
const headers = rows.shift().split(';').map(s => s.trim());
for (const name of ['CODIGO', 'DESCRIPCION', 'X 4 EFEC']) {
  if (!headers.includes(name)) throw new Error(`Falta columna ${name}`);
}
const position = name => headers.indexOf(name);
const inventory = new Map((stock.products || []).map(item => [String(item.sku), item]));
const stockTime = Date.parse(stock.generatedAt);
if (!Number.isFinite(stockTime)) throw new Error('stock.generatedAt inválido');
const ttl = 36 * 60 * 60 * 1000;
const grouped = new Map();

for (const row of rows) {
  const cells = row.split(';');
  const sku = (cells[position('CODIGO')] || '').trim();
  const description = (cells[position('DESCRIPCION')] || '').trim();
  const match = description.match(/\b\d{3}(?:\/\d{2})?Z?R(?:1[0-9]|2[0-4])C?\b/i);
  if (!sku || !match) continue;
  const price = Number((cells[position('X 4 EFEC')] || '').replace(/\D/g, ''));
  const item = inventory.get(sku);
  const checkedTime = Date.parse(item?.checkedAt);
  const validUntil = Math.min(stockTime, checkedTime) + ttl;
  if (!Number.isFinite(price) || price <= 0 || item?.status !== 'ok'
      || Number(item.available) < 4 || !Number.isFinite(checkedTime)
      || validUntil <= Date.now()) continue;
  const measure = match[0].toUpperCase();
  if (!grouped.has(measure)) grouped.set(measure, []);
  grouped.get(measure).push({ description, price, validUntil });
}

const tires = {};
for (const [measure, options] of [...grouped].sort((a, b) => a[0].localeCompare(b[0]))) {
  options.sort((a, b) => a.price - b.price || a.description.localeCompare(b.description));
  const chosen = options.slice(0, 3);
  const lines = chosen.map(p => `• ${p.description.replace(/^NEUMATICO\s+/i, '')}: $${p.price.toLocaleString('es-CL')}`);
  tires[measure] = {
    reply: `${measure} — precios por 4 en efectivo o transferencia:\n${lines.join('\n')}\nDisponibilidad sujeta a confirmación final.`,
    validUntil: new Date(Math.min(...chosen.map(p => p.validUntil))).toISOString(),
    optionCount: options.length
  };
}

const rims = {};
for (const route of routes.rutas) {
  const key = `${route.aro}|${route.apernadura.toLowerCase()}`;
  if (rims[key] && rims[key] !== route.url) throw new Error(`Ruta de llanta duplicada: ${key}`);
  rims[key] = route.url;
}

const index = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  stockGeneratedAt: stock.generatedAt,
  stockStatus: stock.status,
  tires,
  rims: Object.fromEntries(Object.entries(rims).sort((a, b) => a[0].localeCompare(b[0])))
};
fs.writeFileSync(output, JSON.stringify(index, null, 2) + '\n');
console.log(`Índice creado: ${Object.keys(tires).length} medidas y ${Object.keys(rims).length} rutas`);
