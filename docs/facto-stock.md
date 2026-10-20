# Prueba de acceso al stock de Facto

Esta primera etapa verifica que la llave REST de «Software propio» permite
autenticarse, encontrar un SKU y consultar su stock total. El cotizador todavía
lee sus precios desde `Webprecios/files/stock-bodega.csv`; esta prueba no conecta
su interfaz ni publica un inventario. Primero se debe validar el acceso real.

## Configurar las cuatro credenciales

En GitHub abre **Settings → Secrets and variables → Actions → New repository secret**:

| Nombre exacto del secreto | Campo de la llave REST de Facto |
| --- | --- |
| `FACTO_CLIENT_ID` | Client Identification |
| `FACTO_CLIENT_SECRET` | Client Secret |
| `FACTO_USERNAME` | Resource Owner Name |
| `FACTO_PASSWORD` | Resource Owner Password |

Usa la llave nueva de Software propio. Una llave que se haya mostrado en una
captura debe revocarse y reemplazarse. No uses tu contraseña de inicio de sesión
ni la llave de Jumpseller. Los valores se ingresan solo en Secrets, nunca en el
CSV, HTML, JavaScript público, comentarios o mensajes.

`Account ID` no se envía en estas tres operaciones: los endpoints documentados
de autenticación y productos no lo incluyen. Si Facto requiere otro mecanismo
para la cuenta, se deberá confirmar con soporte; no inventar cabeceras.

## Ejecutar

1. Extrae `Samcor-Facto-prueba.zip` en Windows. En la raíz del repositorio,
   usa **Add file → Upload files** y arrastra las carpetas `.github`, `scripts`
   y `docs` conservando su estructura. Sube los archivos extraídos, no el ZIP.
   Guarda los cambios en una rama nueva y abre un pull request para revisarlos.
   Si GitHub omite `.github` al arrastrar, usa **Add file → Create new file**,
   escribe `.github/workflows/facto-stock-prueba.yml` como nombre y pega el
   contenido de ese archivo del paquete. Revisa e incorpora el cambio a `master`.
   GitHub requiere que el workflow manual exista en la rama predeterminada para
   habilitar su ejecución.
2. Agrega los cuatro secretos indicados arriba.
3. Abre **Actions → Probar stock Facto → Run workflow**.
4. Selecciona `master` e ingresa un SKU activo conocido. El ejemplo corresponde
   a un código del CSV; verifica que exista y esté activo en Facto.
5. Ejecuta y revisa el resumen. Un resultado correcto comprueba acceso y un
   número de stock válido, no comprueba su coincidencia con el panel ni las tarifas.

Se realiza una autenticación y hasta dos consultas GET, sin reintentos ni
ejecución programada. No crea documentos, reservas, cambios de stock ni archivos
de inventario. En este repositorio público el resumen y los logs pueden ser
visibles: por eso solo muestran el estado de la prueba, sin cantidades, SKU,
respuestas crudas ni credenciales. El SKU ingresado puede ser visible como
metadato de la ejecución; no introduzcas contraseñas en ese campo.

## Qué verifica

- `POST https://apifacto.com/v1/auth`: obtiene el token en memoria.
- `GET /v1/products?sku=...`: exige exactamente un producto con ese SKU.
- `GET /v1/products/{product_id}`: vuelve a comprobar el SKU y el ID.
- Lee `inventories.total_available` sin sumar otra vez las bodegas ni restar
  `total_reserved`. Acepta cero como stock válido y conserva valores negativos.
- Un producto ausente, respuesta inválida, fallo de red o permiso denegado nunca
  se convierte en stock cero. La prueba termina con error y «Stock sin verificar».
- Rechaza redirecciones para evitar reenviar credenciales a otros destinos.

## Si falla

| Resultado | Siguiente paso |
| --- | --- |
| Falta un secreto | Revisar los cuatro nombres y valores en Settings. |
| HTTP 401 | Comprobar que se utilizó una llave REST vigente de Software propio. |
| HTTP 403 | Consultar a Facto por permisos de lectura de productos/inventario. No prueba por sí solo un problema de pago. |
| HTTP 402 | Confirmar con Facto las condiciones de la cuenta. |
| HTTP 429 | Esperar al menos 30 segundos antes de ejecutar otra prueba. |
| SKU no encontrado | Probar un código exacto que esté activo en Facto. |
| Formato inesperado | Revisar la respuesta en un entorno privado antes de adaptar el lector. No pegar respuestas completas en logs públicos. |

Las condiciones comerciales para consultas de inventario deben confirmarse
con Facto. Una autenticación exitosa no demuestra que el servicio sea gratuito.

## Siguiente etapa del cotizador

Con el acceso validado, conectar un servicio privado al cotizador para unir
`CODIGO` con `sku`, conservar los precios del CSV y mostrar `total_available` con
su fecha de consulta. Contrastar primero un SKU con el panel de Facto. El total
puede incluir unidades repartidas entre bodegas. La interfaz debe indicar «Stock
sin verificar» ante errores y señalar cantidades insuficientes para paquetes de
dos o cuatro neumáticos. Falta definir el alojamiento de ese servicio; GitHub
Pages no ejecuta un backend que oculte las credenciales.

## Pruebas locales (Node.js 22 o superior)

Desde la raíz del repositorio, también en PowerShell de Windows:

```powershell
node --test scripts/facto-stock.test.mjs
```

Las pruebas usan respuestas simuladas y no necesitan credenciales ni red.

## Referencias

- [Autenticación REST](https://facto.cl/documentacion/api/es/endpoints/?ep=post-auth)
- [Buscar productos por SKU](https://facto.cl/documentacion/api/es/endpoints/?ep=get-products)
- [Detalle e inventario del producto](https://facto.cl/documentacion/api/es/endpoints/?ep=get-products-product-id-)
- [Buenas prácticas de Facto](https://facto.cl/documentacion/api/es/ejemplos/chile/buenas-practicas/)
- [Secretos de GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Ejecución manual de workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
