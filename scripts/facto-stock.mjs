// Cliente de solo lectura: autentica y consulta un producto, sin emitir documentos.
import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://apifacto.com/v1';
const CREDENTIAL_FIELDS = {
  client_id: 'FACTO_CLIENT_ID',
  client_secret: 'FACTO_CLIENT_SECRET',
  username: 'FACTO_USERNAME',
  password: 'FACTO_PASSWORD',
};

export class FactoError extends Error {}

export function credentialsFromEnv(env) {
  const credentials = {};
  for (const [field, variable] of Object.entries(CREDENTIAL_FIELDS)) {
    if (typeof env[variable] !== 'string' || !env[variable].trim()) {
      throw new FactoError(`Falta configurar el secreto ${variable}.`);
    }
    credentials[field] = env[variable].trim();
  }
  return credentials;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validId(id) {
  return (typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
    || (typeof id === 'string' && /^[1-9]\d*$/.test(id));
}

function quantity(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

async function request(fetchImpl, path, { token, body } = {}) {
  const stage = path === '/auth' ? 'Autenticación (POST /auth)'
    : path.startsWith('/products?') ? 'Búsqueda por SKU (GET /products)'
      : 'Lectura de inventario (GET /products/{id})';
  let response;
  try {
    response = await fetchImpl(`${API}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      // No reenviar credenciales a un destino de redirección.
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new FactoError(`${stage}: No se pudo contactar a Facto: revisa la red o inténtalo más tarde.`);
  }
  if (!response.ok) {
    const messages = {
      400: 'Facto rechazó la solicitud (HTTP 400). El estado por sí solo no identifica la causa.',
      401: 'Facto rechazó la autenticación (HTTP 401). Revisa las credenciales REST.',
      402: 'Facto respondió HTTP 402. Consulta con soporte las condiciones de tu cuenta.',
      403: 'Facto denegó el acceso (HTTP 403). Confirma los permisos de consulta con soporte.',
      404: 'Facto no encontró el recurso solicitado (HTTP 404).',
      429: 'Facto limitó las consultas (HTTP 429). Espera al menos 30 segundos antes de volver a probar.',
    };
    // Solo traducir códigos conocidos. Nunca imprimir error_description, mensajes,
    // cabeceras o respuestas crudas: pueden incluir credenciales o información privada.
    const knownErrors = {
      invalid_client: 'invalid_client: revisa Client Identification y Client Secret de la misma llave REST vigente.',
      invalid_grant: 'invalid_grant: revisa Resource Owner Name y Resource Owner Password de la misma llave REST vigente.',
      invalid_request: 'invalid_request: Facto considera incompleta o inválida la solicitud; hay que revisar el formato requerido.',
      unsupported_grant_type: 'unsupported_grant_type: Facto rechazó el tipo de autenticación password documentado; confirma la configuración REST.',
      unauthorized_client: 'unauthorized_client: el cliente no está autorizado para esta autenticación; consulta a soporte.',
      invalid_scope: 'invalid_scope: Facto rechazó el alcance solicitado; consulta a soporte.',
    };
    let hint = '';
    try {
      const errorBody = await response.json();
      const code = isObject(errorBody) ? errorBody.error : null;
      if (typeof code === 'string' && Object.hasOwn(knownErrors, code)) hint = ` ${knownErrors[code]}`;
    } catch { /* Conservar etapa y HTTP aunque el cuerpo no sea JSON. */ }
    throw new FactoError(`${stage}: ${messages[response.status] || 'Facto respondió con un error HTTP.'}${hint}`);
  }
  try {
    return await response.json();
  } catch {
    throw new FactoError(`${stage}: Facto devolvió una respuesta JSON inválida o incompleta.`);
  }
}

export async function readStock({ credentials, sku, fetchImpl = fetch }) {
  if (typeof sku !== 'string' || !sku.trim() || sku.length > 200 || /[\x00-\x1f\x7f]/.test(sku)) {
    throw new FactoError('Indica un SKU válido para la prueba.');
  }
  sku = sku.trim();
  const auth = await request(fetchImpl, '/auth', {
    body: { grant_type: 'password', ...credentials },
  });
  if (!isObject(auth) || typeof auth.access_token !== 'string' || !auth.access_token.trim()
      || /[\r\n]/.test(auth.access_token)) {
    throw new FactoError('Facto no devolvió un token válido.');
  }
  const token = auth.access_token;
  const products = await request(fetchImpl, `/products?${new URLSearchParams({ sku })}`, { token });
  if (!Array.isArray(products)) {
    throw new FactoError('El listado de productos no coincide con el formato documentado. Stock sin verificar.');
  }
  const matches = products.filter(product => isObject(product) && product.sku === sku);
  if (matches.length !== 1) {
    throw new FactoError(matches.length ? 'Hay varios productos con el mismo SKU. Stock sin verificar.'
      : 'No se encontró una coincidencia exacta del SKU entre los productos activos. Stock sin verificar.');
  }
  const id = matches[0].product_id;
  if (!validId(id)) throw new FactoError('Facto devolvió un identificador de producto inválido.');
  const product = await request(fetchImpl, `/products/${id}`, { token });
  if (!isObject(product) || product.sku !== sku || String(product.product_id) !== String(id)) {
    throw new FactoError('El detalle recibido no corresponde al producto solicitado. Stock sin verificar.');
  }
  const total = isObject(product.inventories) ? quantity(product.inventories.total_available) : null;
  if (total === null) throw new FactoError('Facto no entregó un stock total válido. Stock sin verificar.');
  // Usar total_available tal como lo entrega Facto: no restar reservas otra vez
  // ni sumar el total y los detalles de las bodegas (duplicaría las unidades).
  return { sku, available: total, checkedAt: new Date().toISOString() };
}

export async function runProbe({ env = process.env, fetchImpl = fetch, log = console.log, summary } = {}) {
  let success = false;
  let message;
  try {
    await readStock({ credentials: credentialsFromEnv(env), sku: env.FACTO_TEST_SKU, fetchImpl });
    success = true;
    message = 'Conexión correcta: autenticación, coincidencia de SKU y stock total verificados. '
      + 'Las cantidades se mantienen privadas. Esta prueba no confirma las tarifas de Facto.';
  } catch (error) {
    message = error instanceof FactoError ? error.message : 'La prueba falló. Stock sin verificar.';
  }
  log(message);
  if (summary) await summary(message);
  return success ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = await runProbe({
      summary: process.env.GITHUB_STEP_SUMMARY
        ? message => appendFile(process.env.GITHUB_STEP_SUMMARY, `## Prueba Facto\n\n${message}\n`)
        : undefined,
    });
  } catch {
    console.error('No se pudo guardar el resumen de la prueba.');
    process.exitCode = 1;
  }
}
