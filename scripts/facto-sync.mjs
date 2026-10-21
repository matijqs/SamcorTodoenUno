import { readFile, writeFile, rename, appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { FactoError, credentialsFromEnv, createStockReader } from './facto-stock.mjs';

export function csvSkus(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"' && !field && !closed) quoted = true;
    else if (char === ';') { row.push(field); field = ''; closed = false; }
    else if (char === '\r' || char === '\n') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = ''; closed = false;
    } else {
      if (closed || char === '"') throw new FactoError('El CSV tiene comillas inválidas.');
      field += char;
    }
  }
  if (quoted) throw new FactoError('El CSV tiene comillas sin cerrar.');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  const header = rows.shift()?.map(cell => cell.trim()) ?? [];
  if (header.filter(cell => cell === 'CODIGO').length !== 1) {
    throw new FactoError('El CSV debe tener una única columna CODIGO separada por punto y coma.');
  }
  const index = header.indexOf('CODIGO');
  const skus = new Set();
  for (const cells of rows) {
    if (cells.every(cell => !cell.trim())) continue;
    const sku = cells[index]?.trim();
    if (!sku || sku.length > 200 || /[\x00-\x1f\x7f]/.test(sku)) {
      throw new FactoError('Hay un CODIGO vacío o inválido en el CSV. No se publicó stock.');
    }
    skus.add(sku);
  }
  if (!skus.size || skus.size > 10000) throw new FactoError('Cantidad de SKU del CSV inválida.');
  return [...skus];
}

// Secuencial, con espera mínima de 30 s tras un 429 y reintentos acotados.
export function pacedFetch({ fetchImpl = fetch, sleep = delay, spacingMs = 1000, now = Date.now } = {}) {
  let first = true;
  return async (url, options) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!first) await sleep(spacingMs);
      first = false;
      const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(15000) });
      if (response.status !== 429 || attempt === 2) return response;
      const retryAfter = response.headers.get('retry-after');
      let waitMs = 30000 * (2 ** attempt);
      if (retryAfter) {
        const seconds = Number(retryAfter);
        const suggested = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - now();
        if (Number.isFinite(suggested)) waitMs = Math.max(waitMs, suggested);
      }
      if (waitMs > 120000) return response;
      await response.body?.cancel();
      await sleep(waitMs);
    }
  };
}

export async function buildSnapshot({ skus, readStock, now = Date.now, progress = () => {}, maxDurationMs = 40 * 60000 }) {
  const started = now();
  const products = [];
  let verified = 0, consecutiveErrors = 0, stopped = false;
  for (const sku of skus) {
    if (now() - started > maxDurationMs) stopped = true;
    if (stopped) {
      products.push({ sku, status: 'unverified', available: null, checkedAt: null });
      continue;
    }
    try {
      const item = await readStock(sku);
      const timestamp = Date.parse(item.checkedAt);
      if (item.sku !== sku || typeof item.available !== 'number' || !Number.isFinite(item.available)
          || !Number.isFinite(timestamp) || timestamp > now() + 60000) {
        throw new FactoError('Respuesta de stock inválida.');
      }
      products.push({ sku, status: 'ok', available: item.available, checkedAt: item.checkedAt });
      verified++;
      consecutiveErrors = 0;
    } catch (error) {
      products.push({ sku, status: 'unverified', available: null, checkedAt: null });
      consecutiveErrors = error?.transient || error?.status >= 500 ? consecutiveErrors + 1 : 0;
      if (error?.fatal || [401, 402, 403, 429].includes(error?.status) || consecutiveErrors >= 5) stopped = true;
    }
    if (products.length % 50 === 0) progress({ processed: products.length, total: skus.length, verified });
  }
  if (!verified) throw new FactoError('Ningún stock pudo verificarse. Se conserva el archivo anterior; revisa la prueba individual.');
  return {
    schemaVersion: 1, generatedAt: new Date(now()).toISOString(),
    status: verified === skus.length ? 'complete' : 'partial',
    total: skus.length, verified, products,
  };
}

export async function saveSnapshot(path, snapshot) {
  await mkdir(dirname(path), { recursive: true });
  const temp = path + '.tmp';
  await writeFile(temp, JSON.stringify(snapshot, null, 2) + '\n', { mode: 0o644 });
  await rename(temp, path);
}

async function main() {
  const skus = csvSkus(await readFile('Webprecios/files/stock-bodega.csv', 'utf8'));
  const readStock = createStockReader({
    credentials: credentialsFromEnv(process.env), fetchImpl: pacedFetch(),
  });
  const snapshot = await buildSnapshot({
    skus, readStock,
    progress: ({ processed, total, verified }) =>
      console.log('Progreso: ' + processed + '/' + total + '; verificados: ' + verified + '.'),
  });
  await saveSnapshot('Webprecios/files/stock-facto.json', snapshot);
  const message = 'Consulta terminada: ' + snapshot.verified + ' de ' + snapshot.total
    + ' SKU verificados. Estado: ' + snapshot.status + '. El siguiente paso guarda el archivo público.';
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, '## Stock diario Facto\n\n' + message + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error instanceof FactoError ? error.message : 'No se pudo actualizar el stock. Se conserva el archivo anterior.');
    process.exitCode = 1;
  });
}

