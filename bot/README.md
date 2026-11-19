# Índice público para el bot de WhatsApp de Samcor

`scripts/bot-index.mjs` combina el CSV de precios, el JSON de stock de Facto y las rutas verificadas de llantas en `Webprecios/files/bot-index.json`. Es una fuente de solo lectura para un escenario de Make Free; no contiene mensajes ni datos de clientes.

## Uso en Make

1. El escenario recibe **solo mensajes entrantes de clientes** desde WhatsApp Business Cloud.
2. Se extrae la medida del neumático (`205/55R16` o `145R13C`) o el par `aro|apernadura` de la llanta (`14|4x100`) con Text parser. Si faltan datos, se pide aclaración.
3. HTTP > Make a request lee `https://matijqs.github.io/SamcorTodoenUno/Webprecios/files/bot-index.json` con `Parse response = Yes`.
4. La función `get(object; path)` busca la clave exacta en `tires` o `rims`. No se construyen URLs de llantas por patrón.
5. Para neumáticos, se envía `reply` solo si existe la clave y `validUntil` es posterior al momento actual. Si no hay clave o está vencida, se deriva a una persona sin afirmar disponibilidad.
6. Para llantas, se envía la URL únicamente si existe la clave exacta. Si no existe, se deriva o pide corregir aro/apernadura.
7. Solo se envían respuestas libres dentro de las 24 horas posteriores al mensaje del cliente. Fuera de ese plazo se usan únicamente plantillas aprobadas.

El escenario debe filtrar mensajes enviados por la empresa, estados y eventos repetidos para evitar bucles. Debe incluir una ruta clara a atención humana y permanecer inactivo hasta completar la conexión y pruebas con el número de Samcor.

## Actualización

El flujo diario de Facto regenera el índice después de publicar el stock. Otro flujo lo regenera cuando cambian el CSV de precios, las rutas o el script. `validUntil` representa el vencimiento más temprano entre la revisión de stock de Facto y el archivo de stock; Make debe comprobarlo antes de cotizar.
