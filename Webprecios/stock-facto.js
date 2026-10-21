(function (root) {
  'use strict';
  // Archivo público; nunca credenciales ni consultas directas a Facto.
  const URL_STOCK = 'https://raw.githubusercontent.com/matijqs/SamcorTodoenUno/master/Webprecios/files/stock-facto.json';
  const MAX_AGE = 36 * 60 * 60 * 1000;
  const CACHE_MS = 5 * 60 * 1000;
  let cached = null, loadedAt = 0, pending = null;

  function validDate(value, now) {
    const time = typeof value === 'string' ? Date.parse(value) : NaN;
    return Number.isFinite(time) && time <= now + 60000 ? time : null;
  }
  function parseSnapshot(value, now = Date.now()) {
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.products)
        || validDate(value.generatedAt, now) === null
        || !['complete', 'partial'].includes(value.status)) throw new Error('Stock inválido');
    const products = new Map();
    for (const item of value.products) {
      if (!item || typeof item.sku !== 'string' || !item.sku || products.has(item.sku)) {
        throw new Error('SKU inválido o duplicado');
      }
      const checked = validDate(item.checkedAt, now);
      if (item.status === 'ok' && typeof item.available === 'number'
          && Number.isFinite(item.available) && checked !== null) {
        products.set(item.sku, { available: item.available, checkedAt: checked });
      } else products.set(item.sku, null);
    }
    return { products, generatedAt: Date.parse(value.generatedAt), status: value.status };
  }
  function formatDate(timestamp) {
    return new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(timestamp));
  }
  function stockView(snapshot, sku, needed, now = Date.now()) {
    const item = snapshot?.products.get(String(sku || '').trim());
    if (!item) return { tone: 'unknown', text: 'Stock sin verificar' };
    const amount = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(item.available);
    if (now - item.checkedAt > MAX_AGE || now - snapshot.generatedAt > MAX_AGE) {
      return { tone: 'unknown', text: 'Último stock: ' + amount + ' u · Dato desactualizado',
        detail: 'Consultado el ' + formatDate(item.checkedAt) };
    }
    const prefix = 'Stock registrado: ' + amount + ' u';
    if (item.available <= 0) return { tone: 'empty', text: prefix + ' · Sin disponibilidad',
      detail: 'Consultado el ' + formatDate(item.checkedAt) };
    if (item.available < needed) return { tone: 'low', text: prefix + ' · No alcanza para ' + needed,
      detail: 'Consultado el ' + formatDate(item.checkedAt) };
    return { tone: 'ok', text: prefix + ' · Alcanza para ' + needed,
      detail: 'Consultado el ' + formatDate(item.checkedAt) };
  }
  function quantityFor(column) {
    return column === 'X 4 EFEC' || column === 'X 4 TC' ? 4 : column === 'X 2 EFEC' ? 2 : 1;
  }
  function summary(snapshot, now = Date.now()) {
    if (!snapshot) return 'Stock sin verificar: no se pudo cargar la actualización diaria.';
    const old = now - snapshot.generatedAt > MAX_AGE;
    return 'Stock total de todas las bodegas · Actualización diaria · '
      + (old ? 'Dato desactualizado. Última actualización: ' : 'Última actualización: ')
      + formatDate(snapshot.generatedAt)
      + (snapshot.status === 'partial' ? ' · Consulta parcial: algunos SKU quedaron sin verificar.' : '');
  }
  async function load(fetchImpl = root.fetch.bind(root), now = Date.now()) {
    if (cached && now - loadedAt < CACHE_MS) return cached;
    if (pending) return pending;
    pending = (async () => {
      const response = await fetchImpl(URL_STOCK + '?v=' + Math.floor(now / CACHE_MS), {
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error('Stock no disponible');
      cached = parseSnapshot(await response.json());
      loadedAt = Date.now();
      return cached;
    })();
    try { return await pending; }
    catch { cached = null; loadedAt = 0; throw new Error('Stock no disponible'); }
    finally { pending = null; }
  }
  root.SamcorStock = { parseSnapshot, stockView, quantityFor, summary, load };
})(globalThis);

