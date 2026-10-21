import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readStock, credentialsFromEnv, FactoError } from './facto-stock.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function number(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
const display = value => value === null ? 'ausente o inválido' : String(value);

// Solo cantidades de inventario y estructura. Nunca cuerpos completos,
// nombres, cabeceras, precios, credenciales o mensajes devueltos por la API.
export function describeInventory(inventory) {
  if (!object(inventory)) return ['Inventories: ausente o formato no reconocido.'];
  const total = number(inventory.total_available);
  const reserved = number(inventory.total_reserved);
  const details = inventory.details;
  const rows = Array.isArray(details) ? details : object(details) ? Object.values(details) : [];
  const type = Array.isArray(details) ? 'lista' : object(details) ? 'objeto' : 'ausente u otro tipo';
  const lines = [
    'total_available: ' + display(total),
    'total_reserved: ' + display(reserved),
    'Formato de details: ' + type,
    'Filas de details: ' + rows.length,
  ];
  let validAvailable = rows.length > 0, sumAvailable = 0;
  let validReserved = rows.length > 0, sumReserved = 0;
  const ids = new Set();
  let locationsValid = rows.length > 0;
  for (let i = 0; i < rows.length; i++) {
    const row = object(rows[i]) ? rows[i] : {};
    const available = number(row.available_quantity);
    const reservation = number(row.reserved_quantity);
    if (available === null) validAvailable = false; else sumAvailable += available;
    if (reservation === null) validReserved = false; else sumReserved += reservation;
    const id = row.product_location_id;
    const validId = (typeof id === 'string' && id.trim()) || (typeof id === 'number' && Number.isFinite(id));
    if (!validId || ids.has(String(id))) locationsValid = false;
    if (validId) ids.add(String(id));
    if (i < 20) lines.push('Fila ' + (i + 1) + ': available_quantity=' + display(available)
      + '; reserved_quantity=' + display(reservation));
  }
  if (rows.length > 20) lines.push('Se muestran solo las primeras 20 filas.');
  const sum = validAvailable && Number.isFinite(sumAvailable) ? sumAvailable : null;
  lines.push('Suma diagnóstica de available_quantity: ' + display(sum));
  lines.push('Suma diagnóstica de reserved_quantity: '
    + display(validReserved && Number.isFinite(sumReserved) ? sumReserved : null));
  lines.push('Identificadores de bodega presentes y sin duplicados: ' + (locationsValid ? 'sí' : 'no'));
  if (total !== null && sum !== null) lines.push('Total y suma del detalle coinciden: '
    + (Math.abs(total - sum) < 1e-9 ? 'sí' : 'NO'));
  lines.push('La suma es solo diagnóstica: esta prueba no cambia la fuente del stock.');
  return lines;
}

function inspectBody(body, sku, id) {
  const candidates = [];
  let visited = 0;
  function walk(value, depth = 0) {
    if (++visited > 100 || depth > 3) return;
    if (Array.isArray(value)) { for (const child of value.slice(0, 50)) walk(child, depth + 1); return; }
    if (!object(value)) return;
    if (value.sku === sku && String(value.product_id) === id) {
      candidates.push(value.inventories);
      return;
    }
    for (const child of Object.values(value)) if (object(child) || Array.isArray(child)) walk(child, depth + 1);
  }
  walk(body);
  return candidates.length === 1 ? describeInventory(candidates[0])
    : ['No se pudo aislar un único inventario para el diagnóstico.'];
}

export async function audit({ credentials, sku, expected, fetchImpl = fetch }) {
  const reference = number(expected);
  if (reference === null || reference < 0) throw new FactoError('La cantidad de referencia debe ser un número válido no negativo.');
  let inventoryLines = [];
  const capture = async (url, options) => {
    const response = await fetchImpl(url, options);
    const match = /^https:\/\/apifacto\.com\/v1\/products\/([1-9]\d*)$/.exec(url);
    if (match && options.method === 'GET' && response.ok) {
      try { inventoryLines = inspectBody(await response.clone().json(), sku.trim(), match[1]); }
      catch { inventoryLines = ['No se pudo leer el detalle para el diagnóstico.']; }
    }
    return response;
  };
  const result = await readStock({ credentials, sku, fetchImpl: capture });
  return [
    'Cantidad de referencia indicada por el usuario: ' + reference,
    'Cantidad leída por el cotizador: ' + result.available,
    'Coincide con la referencia: ' + (Math.abs(result.available - reference) < 1e-9 ? 'sí' : 'NO'),
    ...inventoryLines,
    'Consulta de solo lectura: no se modificó Facto ni el archivo público de stock.',
  ].join('\n');
}

async function main() {
  const message = await audit({
    credentials: credentialsFromEnv(process.env),
    sku: process.env.FACTO_TEST_SKU,
    expected: process.env.FACTO_EXPECTED_STOCK,
  });
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, '## Comparación de inventario Facto\n\n' + message.split('\n').map(line => '- ' + line).join('\n') + '\n');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error instanceof FactoError ? error.message : 'No se pudo completar la comparación de inventario.');
    process.exitCode = 1;
  });
}

