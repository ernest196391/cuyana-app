# HANDOFF — CUYANA-WEB-002

## CUYANA-FOOD-004 — cierre 2026-09-13

- Objetivo: ampliar el catálogo sin recrear productos, proveedores ni imágenes.
- Resultado: 8 productos nuevos activos; 3 candidatos bloqueados por revalidación; Compra de Mamá y Doubledow permanecen ocultos.
- Datos: margen 15 % y tasa comercial 245 GYD/USD no cambiaron. Las 8 ofertas vencen a las 24 h y deben revalidarse otra vez antes de la compra externa.
- Migración: `supabase/migrations/20260913072407_cuyana_food_004_catalog_expansion.sql`, aplicada al proyecto canónico.
- QA de datos: 8/8 `purchasable=true`, `GREEN`, oferta primaria aprobada, imagen publicada y fila pública vigente; 0 productos comprables con `image_status=needed`.
- Bloqueos: Huevos no verificable en la ficha dinámica de Supermarket23; Aceite cambió de precio y está agotado; Aseo Personal no coincide con la composición/costo investigados.
- Siguiente acción exacta: revalidar los 8 activos antes del vencimiento y retomar los 3 bloqueados únicamente cuando el proveedor muestre una coincidencia completa.

## CUYANA-UI-CLOSE-004 — Header y marca

Se eliminó “Empezar” de todas las variantes del header. La cabecera muestra el símbolo oficial junto a “Cuyana” sin tagline; el footer usa solo el símbolo. Alimentos ya no muestra los eyebrows redundantes y el bloque final enlaza el WhatsApp real con el texto “Hablar por WhatsApp”. Producción confirmó precios Guyana, imágenes, carrito mixto y enlaces. F12/Ctrl+Shift+M no abre DevTools en el navegador remoto, por lo que las capturas exactas 360/390/412 quedan como única certificación visual pendiente; no implica un cambio de código pendiente.

## CUYANA-MOBILE-POLISH-003 — Cierre móvil

La tienda Guyana-facing usa formateadores exclusivos de moneda (`G$7,593`, `US$30.99`) sin modificar el formato global de CUP, remesas o fechas. Alimentos reduce hero, encabezados, proceso, FAQ y ayuda; elimina del escaparate las funciones todavía inactivas. `ProductCard` comparte en Alimentos y Energía una variante móvil con imagen, nombre limitado, GYD, ETA corta y botón “Añadir”; USD y presentación continúan disponibles fuera de la cuadrícula móvil.

Siguiente bloque: `CUYANA-FOOD-004 — Expansión de catálogo`. Debe partir del seed, fuentes, imágenes, URLs y proveedores conservados por FOOD-001/002, revalidar cada oferta y publicar gradualmente; no rehacer la investigación ni cargar productos incompletos con prisa.

## CUYANA-FOOD-002 — Refinamiento premium + imágenes + GYD

Se trabajó desde `main` `8e7916829a0ae8c326483433156049425d99099a`. Alimentos ya reutiliza el sistema visual de Energía, tiene curación editorial explícita, copys definitivos, soporte real y GYD primario. Se publicaron solo los 17 activos FOOD autorizados en `ASSET_MANIFEST.json`; `draft-reference` quedó fuera.

La base real tiene activa la tasa comercial 245 GYD/USD hasta el 20 de septiembre de 2026. Esta tasa sigue separada de remesas y ahora puede renovarse desde `/admin/abastecimiento`. El checkout queda bloqueado de forma explícita si la tasa vence.

Carnes + Aceite fue revalidado contra el listado vivo de combos de Alawao (USD 35.95, en stock, entrega 24 h) porque su antigua ficha directa devuelve 404. Se guardó una observación nueva con el URL resuelto del listado; no se ocultó ese cambio operativo.

QA final: 123/123 pruebas, TypeScript, lint y build verdes; tres warnings preexistentes en el panel general. Producción certificada con los cuatro combos curados, dos esenciales, imágenes sin roturas, precios GYD/USD y compra habilitada. Los PR #9, #10, #11 y #12 quedaron fusionados; #11 eliminó la caché obsoleta de las lecturas comerciales y #12 normalizó el punto de miles en montos GYD de cuatro cifras.

## CUYANA-FOOD-001 — Checkpoint 1 (2026-09-13)

Se creó el plan maestro y el cimiento de abastecimiento multi-proveedor sin tocar cuenta, carnet, crédito ni tracking. Incluye ocho tablas `market_*` con RLS/sin acceso anónimo, ofertas múltiples, observaciones, auditorías, configuración, snapshot económico por pedido y cálculo/diff puro probado.

Verificación: 113/113 tests, TypeScript y build verdes; lint conserva tres warnings preexistentes. Supabase real confirmó las ocho tablas y sus políticas. Los avisos existentes de funciones de cuenta/Cuadre no nacieron en este bloque y quedaron fuera de alcance.

Siguiente acción exacta: reconstruir desde la investigación Markdown el seed faltante del corte 2026-09-12, importarlo como investigación no comprable y crear `data/catalog/image-manifest.json` sin generar imágenes.

### Checkpoint 2

El seed reconstruido contiene exactamente 5 proveedores, 6 combos y 23 productos. Supabase conserva 29 ofertas/observaciones privadas. Se añadió `market_public_catalog` para que el cliente solo vea fichas CUYANA. Cinco productos fueron revalidados; la URL de Carnes + Aceite pasó a 404 y no se publicó. La categoría, fichas, placeholders y panel protegido de abastecimiento compilan y pasan 114 pruebas.

Siguiente acción exacta: automatizar la revalidación en servidor, cerrar un cuarto combo vigente, conectar el guardado del snapshot de compra y certificar el preview móvil.

### Checkpoint 3

Se cerraron los pendientes operativos: revalidación servidor segura con historial Antes → Ahora, cuarto combo vigente, componentes normalizados y registro del snapshot de compra desde `/admin/abastecimiento`. El catálogo activo tiene cuatro combos y dos esenciales; la capa privada mantiene todas las alternativas investigadas. Las imágenes siguen deliberadamente en placeholders/manifiesto porque se producen en el chat visual separado.

Verificación local: 123/123 pruebas, TypeScript y build verdes; lint solo conserva tres warnings anteriores y ajenos a FOOD. Pendiente inmediato: certificar el preview responsive, mergear PR #8 y comprobar producción.

Supabase Advisors se ejecutó tras las migraciones finales: se optimizaron las políticas e índices de todas las tablas `market_*`. Los avisos restantes pertenecen a funciones/Auth/Cuadre anteriores a FOOD.

### Cierre

PR #8 mergeado a `main` (`1e24abc769292ef50ca3d81257b623c537daa791`) y deployment de producción marcado `success` por Vercel. En `cuyana.casavivadecuba.com`, alimentos, la ficha de Combo Kiosko y carrito responden 200; se verificaron nombres de los cuatro combos, USD 194.29, composición, sustituciones y CTA. FOOD queda cerrado. La única continuidad deliberada es reemplazar placeholders cuando el chat visual entregue activos aprobados y revalidar ofertas cada 24 h.

De: Claude Code (sesión `session_011YVe5XSew1neZgVdirhS38`)
Fecha: 2026-09-12T03:15:00Z (UTC)
Rama: `claude/ecstatic-ramanujan-iv70r6`

## 1. Qué se implementó

Auditoría de `ernesto-rondon-nexo` (con evidencia de código, no
suposiciones) confirmó: WooCommerce real por debajo (no "B/Google
Commerce"); precios en USD; el checkout y las "gestoras" de NEXO siempre
abren **su propio** WhatsApp (`5354056173`), nunca el del canal; su
endpoint público `GET /api/marketplace/products` no exige credenciales
pero su parámetro `category` espera un ID numérico de WooCommerce (no un
slug, no sirve para filtrar por fuera). Con eso, se implementó el flujo
mínimo completo para energía:

- `src/lib/catalog/nexoAdapter.ts` (reescrito): `listByCategory("energia")`
  y `getProduct()` leen `NEXO_CATALOG_URL` en vivo, paginando y filtrando
  por categoría real (`nexoCategories.ts`, replica el filtro de la propia
  tienda NEXO). "alimentos" sigue `not_configured` a propósito.
- `src/lib/catalog/nexoProducts.ts`: mapeo WooCommerce → `CatalogProduct`,
  resolución de imágenes relativas contra el origin de NEXO, limpieza de
  HTML de la descripción.
- `src/lib/catalog/commercialRate.ts`: tasa GYD/USD propia de la tienda
  (tabla nueva `commercial_rates`), con vigencia (`expires_at`);
  independiente de la tasa de remesas.
- `src/lib/store/orders.ts` + `src/app/api/store/order/route.ts`: checkout
  server-side. Revalida el precio de cada línea contra el catálogo en vivo
  (nunca confía en el precio del navegador), persiste en `store_orders`
  (Supabase de Cuyana) y solo entonces devuelve el código real del pedido.
  Nunca escribe en WooCommerce.
- `src/lib/store/orderMessage.ts`: mensaje de WhatsApp con marca Cuyana
  (sin mencionar NEXO), armado con el código ya persistido.
- `src/app/(public)/carrito/CarritoClient.tsx`: pide nombre y WhatsApp,
  llama al checkout, y solo si el pedido quedó guardado abre
  `wa.me/5355879222` con el mensaje. Si falla, muestra el error y un
  enlace de contacto genérico (sin inventar un pedido).
- `supabase/migrations/20260912030637_tienda_pedidos_y_tasa_comercial.sql`:
  aplicada directamente al Supabase real (`dkiiknsfbefpkrnmbzid`) vía MCP
  y versionada aquí. RLS: `commercial_rates` lectura pública/escritura solo
  admin; `store_orders` inserción pública (mismo patrón que `orders` de
  remesas), lectura/actualización solo admin.
- `next.config.mjs`: `images.remotePatterns` para los dominios de imagen de
  NEXO (`nexotienda.casavivadecuba.com`, `casavivadecuba.com`).
- `/tienda/energia`, `/tienda/alimentos`, `/producto/[slug]`, `/carrito`:
  forzadas a `dynamic = "force-dynamic"` (ver `docs/DECISIONS.md` — sin
  esto, Next.js las congelaba como HTML estático del build porque en este
  entorno no hay `NEXO_CATALOG_URL`, así que el código en vivo nunca se
  ejecutaba durante el build).

## 2. Pruebas y verificación

- `npm run build`, `npm run lint`, `npx tsc --noEmit`: verdes.
- `npx vitest run`: 57/57 pruebas (21 nuevas: `nexoCategories.test.ts`,
  `nexoProducts.test.ts`, `orderMessage.test.ts`).
- Verificación manual local (`next start` + curl) del estado honesto sin
  `NEXO_CATALOG_URL`: `/tienda/energia` y `/tienda/alimentos` muestran
  "Catálogo en preparación"; `/carrito` muestra los campos de nombre/
  WhatsApp y el estado vacío.
- Migración aplicada al proyecto Supabase real; `get_advisors` (security)
  no reporta nada nuevo (solo el aviso preexistente de "Leaked Password
  Protection" ya conocido, fuera de alcance).

## 3. Bloqueo externo real: no se pudo verificar contra NEXO en vivo

Igual que el bloqueo de Vercel/red documentado en CUYANA-WEB-001: el proxy
de egress de este entorno rechaza explícitamente
`nexotienda.casavivadecuba.com` (`connect_rejected`, confirmado con
`curl` y con `__agentproxy/status`). Por lo tanto **no se pudo**:

- confirmar en vivo que `GET /api/marketplace/products` responde y trae
  productos reales de energía (sí se confirmó por lectura de código: el
  endpoint existe, es público, y hay SKUs de energía reales en el catálogo
  editorial de NEXO — paneles Boviet, inversor SUMRY, EcoFlow, BLUETTI,
  ventiladores solares);
- probar el flujo completo (agregar al carrito → checkout → WhatsApp) con
  datos reales de NEXO;
- confirmar que la resolución de imágenes relativas funciona contra una
  respuesta real (sí está cubierta por prueba unitaria con un caso
  representativo tomado del código fuente de NEXO).

**Siguiente paso para quien retome esto (con red hacia
`nexotienda.casavivadecuba.com` habilitada, o desde Vercel):**

1. Configurar `NEXO_CATALOG_URL=https://nexotienda.casavivadecuba.com/api/marketplace/products`
   en Vercel (ya está como valor de ejemplo en `.env.example`).
2. Abrir `/tienda/energia` y `/producto/[slug]` de un producto real; confirmar
   que cargan nombre, precio, imagen y disponibilidad reales.
3. Cargar una fila en `commercial_rates` (`id='gyd_usd'`) desde Supabase
   Studio con la tasa comercial real, y confirmar que el precio pasa a
   mostrar GYD primero y USD entre paréntesis.
4. Probar el checkout completo: agregar producto al carrito, confirmar
   pedido, verificar que aparece en `store_orders` con código y precio
   correctos, y que el WhatsApp que se abre es el de Cuyana
   (`5355879222`) con el texto correcto (sin mencionar NEXO).
5. Si NEXO llega a exigir autenticación en su endpoint público, solo hay
   que setear `NEXO_CATALOG_API_KEY` — el adaptador ya lo manda como
   `Authorization: Bearer`.

## 4. Drift de esquema detectado en Supabase (no provocado por esta tarea)

Al inspeccionar el proyecto real antes de migrar, `list_migrations` mostró
5 migraciones aplicadas el 2026-09-12 (`cuadre_esquema_parte1..4`,
`cuadre_cerrar_anon_del_esquema`) que **no existen como archivo** en
`supabase/migrations/` de este repo. Crean un esquema completo aparte
(`cuadre.*`: tenants, profiles, contacts, workers, destination_accounts,
pan_reveals, delivery_methods, inbound_orders, purchases, deliveries,
api_keys, usdt_market_rates, commission_entries, commission_payouts) — no
colisiona con nada de esta tarea (`public.commercial_rates`,
`public.store_orders`), así que no se tocó ni se investigó más a fondo por
estar fuera de alcance. Se deja constancia aquí y en `docs/TASKS.md` para
que quien aplicó esas migraciones (u otro agente) versione los archivos
correspondientes y evitar que el repo y la base real sigan divergiendo.

## 5. Coordinación con el repo NEXO

`ernesto-rondon-nexo` no se modificó (esta tarea es de solo lectura sobre
ese repo). Su propio `docs/ROADMAP.md` ya tiene un bloque 7 — "Cuyana
ecommerce como canal de marca blanca" — dentro de una tarea de
consolidación (`PS1-B01-T01`) reclamada por otro agente (ChatGPT) en ese
repositorio. Quien retome trabajo ahí debería coordinar con esa tarea antes
de tocar `lib/commerce/`, `lib/commercial/` o los endpoints de
`app/api/marketplace|gestoras` para evitar pisarse.

## 6. Intento de puesta en producción y certificación (2026-09-12T03:30:00Z)

Se intentó ejecutar los 9 pasos pedidos (configurar `NEXO_CATALOG_URL` en
Vercel, verificar variables, desplegar el commit
`dbeef7144efbb8b3bf31c3afadfaa97b6f747f4f` a producción, probar el flujo en
la URL pública móvil, confirmar que no se crea pedido en WooCommerce,
revisar logs de Vercel). **Bloqueado en el paso 1**, antes de poder tocar
nada en Vercel: esta sesión no tiene acceso funcional a la cuenta/proyecto
Vercel reales. No es un fallo de código ni de esta implementación — es el
mismo tipo de bloqueo de acceso ya documentado en el HANDOFF de
CUYANA-WEB-001 (§3), confirmado de nuevo hoy con evidencia adicional:

- `mcp__Vercel__list_teams` → `{"teams": []}` (ningún equipo visible para
  esta sesión).
- `mcp__Vercel__list_projects` → error genérico (sin equipo, no hay de
  dónde listar proyectos).
- `mcp__Vercel__web_fetch_vercel_url` sobre
  `https://cuyana.casavivadecuba.com/tienda/energia` → `403 Forbidden` al
  intentar verificar el deployment (esta herramienta está pensada para
  saltarse restricciones de acceso cuando el usuario del MCP sí tiene
  permiso; aquí ni así funciona).
- No existe `.vercel/project.json` en el repo para inferir el project ID.
- No hay `.github/workflows` en este repo: el despliegue depende
  enteramente de la integración Git↔Vercel ya configurada del lado de
  Vercel, que esta sesión no puede inspeccionar ni disparar.

**Diagnóstico de red pedido en el paso 8 — respondido, aunque de forma
parcial por la misma razón:** desde esta sesión, tanto `curl` (vía el
proxy de egress local, `__agentproxy/status`) como la herramienta
`WebFetch` (infraestructura separada) devuelven **el mismo tipo de error**
para ambos dominios:

```
WebFetch → https://nexotienda.casavivadecuba.com/api/marketplace/products
  {"error_type":"EGRESS_BLOCKED","domain":"nexotienda.casavivadecuba.com",
   "message":"Access to nexotienda.casavivadecuba.com is blocked by the
   network egress proxy."}

WebFetch → https://cuyana.casavivadecuba.com/tienda/energia
  {"error_type":"EGRESS_BLOCKED","domain":"cuyana.casavivadecuba.com",
   "message":"Access to cuyana.casavivadecuba.com is blocked by the
   network egress proxy."}
```

Esto es una política de egress de **esta sesión/entorno** (bloquea
dominios arbitrarios por defecto, no solo estos dos — el propio dominio de
Cuyana, que sí está en línea, da el mismo error), no una señal de que
`nexotienda.casavivadecuba.com` esté caído, mal resuelto en DNS, o
bloqueado por Cloudflare/Hostinger/Render del lado de NEXO. De hecho, la
propia auditoría de NEXO (`docs/PROJECT_STATUS.md` de ese repo, fila
"NEXO") ya había registrado `https://nexotienda.casavivadecuba.com` como
`200 funcional` desde una sesión con otro tipo de acceso de red. **No se
puede completar el diagnóstico DNS/Cloudflare/Hostinger/Render/endpoint
específico del lado de Vercel** porque esta sesión no puede pedirle a
Vercel que intente esa conexión ni leer sus logs — ese diagnóstico solo se
puede completar una vez que exista una ejecución real en Vercel para
inspeccionar (ver siguiente sección).

## 7. Qué falta y qué necesita acción manual (no técnica) del usuario

Todo lo de código, migración y pruebas locales (secciones 1-2) quedó
terminado y verificado. Lo que sigue requiere una de estas dos cosas,
porque esta sesión no tiene el acceso necesario:

**Opción A — dar acceso real a esta sesión:** conectar/actualizar la
integración de Vercel de esta sesión para que incluya el equipo/proyecto
real de `cuyana-app` (hoy `list_teams` no ve ninguno). Con eso puedo
retomar y ejecutar yo mismo los pasos 1, 3, 4, 6, 7 y 8 pedidos.

**Opción B — que alguien con acceso al dashboard de Vercel ejecute esto y
me pase el resultado** (5-10 minutos):

1. En el proyecto `cuyana-app` → Settings → Environment Variables, agregar
   (Production, y Preview si se quiere probar antes):
   `NEXO_CATALOG_URL=https://nexotienda.casavivadecuba.com/api/marketplace/products`
   No hace falta `NEXO_CATALOG_API_KEY` (el endpoint de NEXO no exige clave
   hoy).
2. Confirmar (sin revelar valores) que ya existen: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (la app
   funciona con valores por defecto en código si faltan, pero es mejor
   tenerlas explícitas).
3. Desplegar `claude/ecstatic-ramanujan-iv70r6` (commit
   `dbeef7144efbb8b3bf31c3afadfaa97b6f747f4f`) — o mergearlo a la rama de
   producción si el proyecto la sigue por Git — y promoverlo a Production.
4. Abrir `https://cuyana.casavivadecuba.com/tienda/energia` en un móvil
   real o con DevTools en modo responsive (390px) y confirmar: productos
   reales de energía con nombre/precio/imagen, entrar a una ficha, agregar
   al carrito, ir a `/carrito`, poner nombre y WhatsApp, confirmar pedido.
5. Confirmar en Supabase (`select * from store_orders order by created_at desc limit 1`)
   que el pedido quedó guardado con el código que apareció en el mensaje de
   WhatsApp, y que el WhatsApp que se abrió es `wa.me/5355879222` (no un
   número de NEXO) con los productos, cantidades, precios y datos del
   cliente correctos.
6. Si en ese momento no hay fila en `commercial_rates`, confirmar que el
   precio se ve solo en USD (sin GYD) y que el checkout igual funciona.
7. Revisar Runtime Logs / Errors de Vercel del deployment; si hay un error
   real (no de red de este entorno), pegarlo aquí para corregirlo.
8. Si en ese entorno real Vercel **tampoco** logra conectar con
   `nexotienda.casavivadecuba.com`, el log de Vercel dirá la causa exacta
   (timeout de conexión = red/firewall; error TLS = certificado; 404/521/522
   = Cloudflare o el origen Hostinger/Render caído; DNS_PROBE/ENOTFOUND =
   DNS) — con ese mensaje exacto puedo diagnosticar y corregir sin
   necesidad de adivinar.

No se generaron capturas de la tienda ni del WhatsApp: esta sesión no puede
renderizar la URL pública real (bloqueada, sección 6) y una captura del
`next start` local solo mostraría el estado honesto "Catálogo en
preparación" (sin `NEXO_CATALOG_URL` alcanzable desde aquí), no el
resultado real con productos de NEXO — no se quiso presentar eso como si
fuera la prueba pedida.

## 8. Actualización (2026-09-12T04:10:00Z) — avance real y bloqueo exacto identificado

El propio usuario (`ernest196391`) abrió y mergeó a `main` tanto
[PR #1](https://github.com/ernest196391/cuyana-app/pull/1)
(CUYANA-WEB-001) como
[PR #2](https://github.com/ernest196391/cuyana-app/pull/2)
(CUYANA-WEB-002, commit `a17e09df14bce8e0f00d9b8fc53f3d4928474217`) — merge
commit en `main`: `e403f54735f1bdcdceb49d8a49d1bc7e5a3abc82`
(2026-09-12T03:58:33Z). Esto confirma que la integración Git→Vercel es
real y funciona: el comentario del bot `vercel[bot]` en el PR #2 muestra un
build de Preview exitoso (`Ready`) para el commit `a17e09d`:

- Proyecto Vercel real: `cuyana-app`, equipo `ernest196391s-projects`
  (`teamId=team_Foa2Q8C10yFVFHG7eK2bVrk3`,
  `projectId=prj_vM3S2ajgshx4VZWnP6YKfmCI4ssv`).
- Preview: `https://cuyana-app-git-claude-ecstatic-ra-717528-ernest196391s-projects.vercel.app`
  — `Ready` a las 2026-09-12T03:58:08Z.
- El check `Vercel` en el PR reporta `state: success`, `"Deployment has
  completed"`.

Con el `projectId`/`teamId` reales, reintenté las herramientas de Vercel
de esta sesión y ahora dan un error **específico y accionable** (antes
era solo "sin equipos visibles"):

```
403 Forbidden — "Not authorized: Trying to access resource under scope
\"ernest196391s-projects\". You must re-authenticate to this scope or use
a token with access to this scope."
```

Es decir: el conector de Vercel de esta sesión sí existe, pero está
autorizado para un scope/cuenta distinto al que tiene `cuyana-app`
(`ernest196391s-projects`). **La acción manual exacta que se necesita:**
reconectar/reautorizar la integración de Vercel de esta sesión
seleccionando explícitamente el equipo `ernest196391s-projects` durante la
autorización. Una vez hecho eso, puedo:
- confirmar si `main` es la rama de producción y si el merge ya generó un
  deployment a producción (o dispararlo yo mismo),
- leer/editar `NEXO_CATALOG_URL` y las demás variables sin exponer valores,
- leer Runtime Logs/Errors reales del deployment.

Además, confirmé que el bloqueo de red de esta sesión (sección 6) **no es
específico de `casavivadecuba.com`**: probé también el propio dominio de
preview de Vercel (`*.vercel.app`, sin relación con NEXO) con `WebFetch` y
con `mcp__Vercel__web_fetch_vercel_url`, y ambos devuelven el mismo
`EGRESS_BLOCKED` / `403`. Es una política de egress general de este
entorno (permite `github.com`, bloquea dominios externos arbitrarios por
defecto), no una señal sobre la salud real de NEXO ni de Vercel. Por eso,
incluso con el scope de Vercel corregido, **esta sesión seguirá sin poder
renderizar visualmente la URL pública o tomar una captura real** — para
eso sí se necesita que el usuario abra el sitio en su propio teléfono/
navegador y comparta el resultado, o una sesión con egress habilitado
hacia dominios públicos arbitrarios.

**Siguiente paso concreto:**
1. (Usuario) Reautorizar el conector de Vercel de esta sesión con el
   scope/equipo `ernest196391s-projects`.
2. (Esta sesión, una vez reautorizado) Confirmar rama de producción,
   configurar `NEXO_CATALOG_URL`, verificar el deployment de producción del
   commit `e403f54` (o redeployarlo), y leer logs reales.
3. (Usuario) Abrir `https://cuyana.casavivadecuba.com/tienda/energia` en un
   teléfono real y confirmar visualmente el flujo — esta sesión no puede
   sustituir ese paso por bloqueo de red, tenga o no acceso a Vercel.

## 9. Reconectado Vercel (2026-09-12T15:35:00Z) — verificación real en producción

El usuario reautorizó el conector. Con acceso real confirmado
(`list_teams` devuelve el equipo `ernest196391s-projects`), pude verificar
`https://cuyana.casavivadecuba.com` en vivo usando
`mcp__Vercel__web_fetch_vercel_url` — esta herramienta sí llega al dominio
real porque pasa por la infraestructura de Vercel, no por el proxy de
egress bloqueado de esta sesión (ese bloqueo de red sigue intacto y sin
relación con esto).

**Hallazgo previo, no de esta tarea:** el proyecto ya tiene un deployment
de producción *más nuevo* que el mío: commit `59c39c3` en `main`
("Los pedidos de remesa llegan también a la bandeja de Cuadre"), de otra
sesión de Claude (`session_01SZgjPcb3UKrAp1PLEwsnUp`, Opus 5), pusheado
directo a `main` sin PR. Revisé su diff completo
(`.env.example`, `README.md`, `src/app/api/cuadre/route.ts`,
`src/components/Calculator.tsx`, `vitest.config.ts`): **no toca ningún
archivo de esta tarea** (`src/lib/catalog/`, `src/lib/store/`,
`src/app/api/store/`, `src/app/(public)/tienda|carrito|producto/`,
`next.config.mjs`, `supabase/migrations/`) y el propio mensaje de commit
dice explícitamente "La tienda no se toca". Sin colisión confirmada.

**Verificación real contra producción (commit `59c39c3`, que incluye mi
merge `e403f54` debajo):**

| Prueba | Resultado |
|---|---|
| Build de producción | `Build Completed in 27s`, sin errores (`get_deployment_build_logs`) |
| Errores en runtime (24h) | Ninguno (`get_runtime_errors`) |
| `GET /tienda/energia` | `200`, `x-vercel-cache: MISS` (confirma `force-dynamic`, no HTML congelado del build). Renderiza "Catálogo en preparación" — correcto y honesto, porque `NEXO_CATALOG_URL` **todavía no está configurada** en Vercel (no hay herramienta en este conector para leer/crear env vars; confirmado que no existe ninguna en el toolset de Vercel disponible). Botón de WhatsApp apunta a `wa.me/5355879222` con mensaje coherente. |
| `GET /carrito` | `200`, "Tu carrito está vacío", `gydPerUsd: null` pasado correctamente al cliente (confirma que sin fila en `commercial_rates` no se rompe nada y el componente recibe `null` tal como se diseñó) |
| Protección de despliegue | `ssoProtection.enabled=true` pero `deploymentType: "all_except_custom_domains"` — el dominio custom `cuyana.casavivadecuba.com` **no** tiene el muro de autenticación de Vercel; un cliente real nunca lo ve. Sin password protection ni IP allowlist. |

**Lo único que falta y que esta sesión no puede hacer por falta de
herramienta (no de permiso):** el conector de Vercel de este entorno no
tiene ningún tool para leer o escribir Environment Variables (verificado
buscando explícitamente). Falta:

1. (Usuario, dashboard de Vercel → `cuyana-app` → Settings →
   Environment Variables → Production) agregar:
   `NEXO_CATALOG_URL=https://nexotienda.casavivadecuba.com/api/marketplace/products`
2. (Usuario) Redesplegar: en Deployments, abrir el último deployment de
   producción y usar "Redeploy" (no hace falta ningún cambio de código;
   Vercel solo aplica variables de entorno nuevas en un deployment nuevo).
3. Avisar aquí — en cuanto eso pase, esta sesión puede volver a correr
   exactamente las mismas verificaciones de la tabla de arriba
   (`web_fetch_vercel_url`, `get_deployment_build_logs`,
   `get_runtime_errors`) contra el nuevo deployment y confirmar productos
   reales, imágenes, ficha, y (con una prueba manual desde el propio
   teléfono del usuario, ya que el checkout depende de `localStorage` del
   navegador) el checkout completo hasta WhatsApp.

## 10. `NEXO_CATALOG_URL` configurada y redesplegada — catálogo real confirmado en vivo (2026-09-12T15:51:00Z)

El usuario cargó la variable y redesplegó dos veces (`dpl_8ZqL1mUz`,
`dpl_xyvzJzfD`, ambas `action: redeploy` del mismo commit `59c39c3`,
`state: READY`, `target: production`). Build sin errores (40 s), cero
errores de runtime. Verificación real contra
`https://cuyana.casavivadecuba.com`:

| Prueba | Resultado |
|---|---|
| `GET /tienda/energia` | `200`. **19 productos reales** de NEXO (Paneles MIESI/LONGi/monocristalino, kits solares, BLUETTI AC70/AC180/Apex 300/Elite 100, EcoFlow DELTA 3/RIVER 3, SUMRY, SIGMA, Infinity Solar, SACO, lámpara LED), precios en USD formato latinoamericano (ej. "575,00 USD"), sin GYD (correcto: no hay fila en `commercial_rates` todavía) |
| Imágenes | Resuelven correctamente: absolutas de `casavivadecuba.com/wp-content/uploads/...` intactas, y la relativa `/api/catalog-image/panel-120w.webp` de NEXO resuelta contra su origin — ninguna rota |
| `GET /producto/inversor-solar-hibrido-sumry-4000w-24v-120v-con-mppt` | `200`. Ficha completa: título, descripción, precio "575,00 USD", imagen real optimizada por `next/image`, botón "Añadir al carrito", `Fuente: nexo · sincronizado 12/9/2026`. Objeto `product` correcto: `sourceSystem: "nexo"`, `sourceProductId: "1058"`, `category: "energia"`, `available: true` |

**Sin colisión con WooCommerce** (confirmado por código, no por suposición): `grep` en `src/` no encuentra ninguna referencia a WooCommerce; el único tráfico hacia NEXO es el `GET` de solo lectura al catálogo.

**Pendiente, ya no de esta sesión sino de una prueba manual real:** agregar al carrito y hacer el checkout completo hasta WhatsApp depende de `localStorage` del navegador del cliente — no se puede automatizar con las herramientas de fetch disponibles (no soportan POST ni JS). Queda para que el usuario lo pruebe una vez en su teléfono: agregar un producto, ir a `/carrito`, poner nombre y WhatsApp, confirmar pedido, y verificar que (a) llega un WhatsApp a `5355879222` con marca Cuyana y los datos correctos, y (b) el pedido aparece en `store_orders` en Supabase.

## 11. Auditoría UX real (capturas del usuario) y corrección — el carrito era un callejón sin salida (2026-09-12T16:10:00Z)

El usuario probó el flujo real en su teléfono (capturas adjuntas) y encontró
lo mismo que el §10 no podía detectar por fetch: **agregar al carrito no
llevaba a ningún lado**. Auditoría de código confirmó la causa raíz:
`SiteHeader.tsx`/`NAV_LINKS` no tenían ningún ícono, contador ni link hacia
`/carrito` — después de "Añadido" no había ninguna pista de que el carrito
existiera. Hallazgos completos (por severidad) y qué se corrigió:

| Hallazgo | Severidad | Corrección |
|---|---|---|
| Sin acceso al carrito desde el header | 🔴 Crítico | `CartIndicator.tsx` nuevo: ícono + contador en el header (desktop y móvil), leyendo `localStorage` vía el evento `cuyana-cart-updated` ya existente |
| "Añadido" sin siguiente paso | 🔴 Crítico | `CartToast.tsx` nuevo: aviso flotante con el producto agregado y un botón directo "Ver carrito", montado una vez en `(public)/layout.tsx`; `addToCart()` ahora dispara `cuyana-cart-added` con nombre y cantidad |
| Sin control de cantidad | 🟠 Alto | Stepper +/− en la ficha de producto (`AddToCartButton.tsx`) y en cada línea del carrito (`updateQuantity()` nuevo en `cart.ts`) |
| Tarjetas sin interacción | 🟠 Alto | `.product-card` con elevación/sombra al pasar el mouse o tocar (`:hover`/`:focus-visible`/`:active`) |
| Botón de confirmar fuera de vista en móvil | 🟡 Medio | Barra fija (`cart-sticky-bar`) con el total y "Confirmar pedido" siempre visibles al fondo de `/carrito` |
| Código de pedido se perdía si se cerraba WhatsApp | 🟡 Medio | El checkout abre WhatsApp en pestaña nueva (`window.open`, ya no navega fuera) y deja una pantalla de confirmación con el código del pedido visible en Cuyana |

**No corregido a propósito, por ser decisión de marca ya documentada**: la
fuente monoespaciada (JetBrains Mono) en precios — `docs/DECISIONS.md`
(2026-09-11) la fija para toda cifra de la app, remesas incluidas; cambiarla
solo en la tienda rompería esa consistencia sin que el negocio lo haya
pedido. Sí quedan pendientes, no bloqueantes: ficha de producto sin galería/
specs estructuradas ni breadcrumb (limitado por lo que NEXO realmente
entrega — no se inventa contenido), y sin "vaciar carrito completo" (se
reemplazó por quitar línea por línea, más el stepper a 0).

Verificado: `npm run build`/`lint`/`tsc --noEmit`/`vitest run` (57/57)
verdes; smoke test local (`next start`) confirma que el ícono de carrito
aparece en portada y que `/carrito` renderiza bien vacío. **No verificado
en vivo con productos reales** (agregar al carrito depende de JS/
`localStorage` del navegador, no de un fetch) — pendiente de que el
usuario lo prueble en su teléfono tras el próximo despliegue.

**Actualización — mergeado y confirmado en vivo (2026-09-12T16:21:00Z):**
el usuario mergeó ([PR #3](https://github.com/ernest196391/cuyana-app/pull/3),
merge commit `fc7b74eec0e945f133ca955015c3da8a5ca190ee`); Vercel desplegó a
producción automáticamente (`dpl_HqTPGUMHGNC4CcsU5o3a6EnwMpF5`, sin
necesidad de redeploy manual esta vez). Confirmé con
`web_fetch_vercel_url` que `cuyana.casavivadecuba.com` ya sirve el ícono
de carrito real en el header (`<a class="cart-indicator" ...>`) y que
`/carrito` renderiza sin errores. Cero errores de build o runtime.

## 12. Bug real encontrado por el usuario en su teléfono: "No se pudo registrar el pedido" — causa raíz y corrección (2026-09-12T16:40:00Z)

El usuario probó el flujo completo (agregar 3× "Infinity Solar MoonFlyer
Pro" al carrito, poner nombre y WhatsApp, confirmar) y el checkout falló
con "No se pudo registrar el pedido. Intenta de nuevo." — a pesar de que
el catálogo y el carrito ya funcionaban bien. Diagnostiqué la causa raíz
**reproduciéndola en vivo contra la base real** (no por inspección de
código):

```sql
-- Como el rol anon (el que usa el navegador), con RETURNING:
insert into public.store_orders (...) values (...) returning id, code;
-- ERROR 42501: new row violates row-level security policy for table "store_orders"

-- La misma fila, sin pedir RETURNING:
insert into public.store_orders (...) values (...);
-- funciona sin error
```

**La causa real:** `store_orders` permite que cualquiera inserte un
pedido (correcto, es la política pensada para el checkout público), pero
solo el admin puede *leer* pedidos (correcto también, por privacidad). El
código de `createStoreOrder()` (`src/lib/store/orders.ts`) pedía de vuelta
la fila recién creada (`.select("id, code").single()`) para confirmar el
pedido al cliente — y Postgres exige que quien inserta con `RETURNING`
también pueda *leer* esa fila bajo RLS. Como el cliente (anon) no puede,
el insert completo fallaba con ese error, **aunque en algunos casos la
fila ya había quedado guardada** — el cliente nunca se enteraba de si su
pedido existía o no.

**Corrección:** el código y el número de pedido ahora se generan en el
servidor *antes* de insertar (no se piden de vuelta a la base), así que
nunca hace falta leer la fila recién creada para confirmar el pedido —
sortea el problema de raíz en vez de abrir el acceso de lectura a
cualquiera. Se agregó además un `console.error` con el detalle real del
error de Supabase para que un fallo futuro se pueda diagnosticar desde los
logs de Vercel sin tener que reproducirlo a mano.

**Verificado antes de dar la corrección por buena:** repetí la prueba SQL
anterior sin `RETURNING` como rol `anon` (`begin; set local role anon;
insert ...; rollback;`) y confirmé que inserta sin error — exactamente el
comportamiento que el código corregido ahora usa.

## 13. Rediseño de la ficha de producto y del carrito (auditoría de diseño del usuario, 2026-09-12T16:40:00Z)

El usuario señaló, con capturas, tres problemas reales de diseño después
de que el flujo ya funcionaba:

1. **La imagen del producto ocupaba casi toda la pantalla, tapando el
   botón de compra.** Causa real: `<Image width={640} height={640} />`
   con CSS `height:auto` hace que el navegador use el alto *natural* de
   la foto real (no 640×640) escalado al ancho de pantalla — con fotos
   verticales/recortadas de NEXO, eso se traduce en una imagen
   desproporcionadamente alta. Corregido: mismo patrón que ya usan las
   tarjetas del catálogo (`fill` + contenedor con `aspect-ratio:1` +
   `object-fit:contain`), así la imagen siempre queda en un cuadro
   controlado.
2. **Sin un botón de compra siempre visible.** Se agregó una barra fija
   al pie de la ficha de producto en móvil (precio + "Añadir al
   carrito"), igual que ya existe en `/carrito`; en escritorio se ve el
   botón normal sin duplicarlo.
3. **"Quitar" en el carrito era un enlace de texto.** Se reemplazó por un
   botón con ícono de papelera, con su etiqueta accesible
   (`aria-label`) intacta para lectores de pantalla.

**No implementado en esta vuelta, por ser una decisión de negocio, no un
bug:** llevar el pedido de tienda también a "Cuadre" (el sistema de
bandeja operativa que otra sesión conectó para remesas). Hoy el pedido
queda en `store_orders` (Supabase), consultable por el admin. Duplicarlo
en Cuadre es totalmente viable (mismo patrón que ya usa
`src/app/api/cuadre/route.ts` para remesas) pero es una integración nueva
con un contrato ajeno que conviene confirmar explícitamente antes de
tocar, no asumir. Ver `docs/TASKS.md` para dejarlo como pendiente
explícito.

Verificado: `npm run build`/`lint`/`tsc --noEmit`/`vitest run` (57/57)
verdes. No se pudo repetir el checkout completo desde esta sesión (depende
de `localStorage`/clics reales) — pendiente de que el usuario lo vuelva a
probar en su teléfono tras el próximo merge.

## 14. Otra sesión arregló el mismo bug en paralelo (conflicto real de merge) + por qué Cuadre queda pendiente de verdad (2026-09-12T16:50:00Z)

Mientras esto se implementaba, **otra sesión de Claude** (Opus 5,
`session_01SZgjPcb3UKrAp1PLEwsnUp`) diagnosticó y corrigió el mismo bug de
RLS/`RETURNING` directamente en `main` (commit `0a420c8`, con su propio
`orders.test.ts` que fija el comportamiento correcto: 4 pruebas nuevas).
Al traer `main` a esta rama hubo un conflicto real de Git en
`src/lib/store/orders.ts` — se resolvió tomando la versión de `main`
completa (mejor: registra el error real con `console.error` sin filtrar
nombre/teléfono, y el mensaje al cliente ofrece una salida —"Escríbenos
por WhatsApp"— en vez de solo "intenta de nuevo"). Nada se perdió de esta
sesión: los cambios de diseño (imagen contenida, barra fija, ícono de
papelera) no tocan ese archivo y quedaron intactos.

**Sobre pedir que el pedido de tienda también aparezca en Cuadre:** antes
de escribir el código, leí `src/app/api/cuadre/route.ts` completo — es el
único contrato de Cuadre visible desde este repo. Está construido
específicamente para remesas: exige `ref` (UUID de una fila en `orders`),
`gyd` (monto en GYD, porque una remesa siempre sale en GYD) y `method_key`
(una fila de `delivery_methods`, para recalcular la tasa) — y con esos
datos rearma un pedido en formato "envío de dinero" (`amount_source`,
`currency_source: GYD`, `method_label`, `rate_used`...) antes de
mandarlo a `${CUADRE_URL}/api/pedidos`.

Un pedido de tienda no tiene nada de eso: no sale en GYD (sale en USD),
no tiene método de entrega, y son productos con nombre y cantidad, no un
monto a convertir. Reusar esa ruta tal cual haría que la llamada devuelva
`400` siempre (falla su propia validación). Intenté una versión que le
mandaba un cuerpo distinto (`origin: "tienda"`, `items`, `totalUsd`...) y
la revertí antes de dejarla a medias: esa ruta ignoraría esos campos
igual, porque la validación se detiene en `!gyd || !metodoKey` antes de
llegar a nada más.

**Lo que hace falta para hacerlo bien, y que no puedo adivinar desde
aquí:** saber si el backend real de Cuadre (`CUADRE_URL/api/pedidos`,
fuera de este repo) tiene o puede tener un endpoint/formato para pedidos
de producto en USD (sin método de entrega ni monto en GYD). Si existe,
solo hay que enseñarle a esta ruta —o crear una hermana, p.ej.
`/api/cuadre/tienda`— el formato correcto. Si no existe todavía, hay que
decidir con quien mantiene Cuadre qué campos espera antes de construir
nada; inventar un formato a ciegas dejaría el aviso a Cuadre fallando en
silencio (como la propia ruta hace hoy si Cuadre no responde: nunca
rompe al cliente, pero tampoco avisa que no llegó). Mientras tanto, el
pedido de tienda sigue quedando completo y correcto en `store_orders`
(Supabase) — lo único que falta es la copia en Cuadre.

---

# HANDOFF — CUYANA-WEB-001

De: Claude Code (sesión `session_01Y7hkVKc2C7hFG1KPakFM81`)
Fecha: 2026-09-11T18:00:00Z (UTC)
Rama: `claude/cuyana-rebranding-ecommerce-t1bse7`

## 1. Qué cambió, por fase

Ver el detalle completo en `docs/PROJECT_STATUS.md`. Resumen:

- Rebranding Cuyana aplicado de forma sistemática (tokens, tipografía,
  logo, favicons/OG/PWA, assets de campaña) desde el paquete
  `cuyana-claude-code-package` adjunto — no desde el brand board original
  (que tenía recortes defectuosos).
- Portada remodelada: hero exacto del prompt maestro, selector de 3
  tarjetas (dinero/alimentos/energía), secciones dedicadas con las 5
  fotografías de campaña, calculadora real embebida sin duplicar lógica
  (mismo componente en `/` y `/enviar-dinero`).
- P0 de auditoría corregidos con pruebas: CTA de WhatsApp bloqueado hasta
  formulario válido; teléfono incluido en el mensaje; "tasa de hoy" fija
  reemplazada por vigente/por_vencer/vencida con confirmación explícita
  si está vencida; saludo "Adonys" migrado a configuración.
- Fachada de tienda (`/tienda`, `/tienda/alimentos`, `/tienda/energia`,
  `/producto/[slug]`, `/carrito`, `/pedido/[codigo]`) con adaptador
  `CatalogProvider` real hacia NEXO, en estado `not_configured` (sin
  inventar productos ni pedidos).
- SEO técnico (`robots.ts`, `sitemap.ts`), páginas legales honestas
  (`/contacto`, `/privacidad`, `/terminos`, `/ayuda`).
- Supabase: migración versionada aplicada al proyecto real, corrige un
  agujero de RLS real (ver `docs/PROJECT_STATUS.md` → Riesgos #2), añade
  `app_config`.
- 31 pruebas automatizadas nuevas (Vitest). Verificación manual de
  overflow horizontal a 360/390/412/1280px con Playwright headless
  (se encontró y corrigió un bug de grid real).

## 2. SHA, rama, estado del build

- Rama de trabajo: `claude/cuyana-rebranding-ecommerce-t1bse7`
- Ver `git log -1` para el SHA exacto del commit de esta tarea (se hizo
  después de este documento; revisar el commit con mensaje que referencia
  CUYANA-WEB-001).
- `npm run lint` → limpio. `npx tsc --noEmit` → limpio. `npm test`
  (Vitest) → 31/31 pruebas verdes. `npm run build` → compila y genera
  las 23 rutas sin error.

## 3. Bloqueo externo real: no se pudo verificar Vercel/producción

Esta sesión **no tiene** acceso efectivo a:

- El proyecto Vercel real (`mcp__Vercel__list_teams` devuelve `[]`: sin
  equipo/proyecto visible para esta sesión).
- La red pública hacia `cuyana.casavivadecuba.com` (el proxy de egress de
  este entorno la bloquea explícitamente: `EGRESS_BLOCKED`).

Por lo tanto, **no se pudo**:

- confirmar el estado de producción antes de este cambio (baseline real);
- disparar ni verificar un deploy de preview;
- promover a producción ni verificarla después;
- hacer el smoke test móvil sobre la URL pública real (sí se hizo sobre
  `next build && next start` local, con Playwright headless, a
  360/390/412/1280px, sin scroll horizontal).

**Siguiente paso para quien retome esto:** con acceso al dashboard de
Vercel (o una sesión con egress habilitado hacia Vercel/el dominio):

1. Confirmar que el proyecto Vercel sigue la rama
   `claude/cuyana-rebranding-ecommerce-t1bse7` (o mergear a la rama que
   sigue) y que generó un preview tras el push de esta tarea.
2. Abrir el preview, repetir el smoke test móvil (360/390/412px, sin
   scroll horizontal; probar `/`, `/enviar-dinero`, `/tienda`,
   `/robots.txt`, `/sitemap.xml`).
3. Verificar variables de entorno en Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (la app
   funciona sin ellas gracias a los defaults en `src/lib/supabase.ts`,
   pero es mejor tenerlas explícitas en Vercel).
4. Promover a producción, confirmar dominio personalizado y HTTPS.
5. Actualizar este `HANDOFF.md` y `docs/PROJECT_STATUS.md` con el
   resultado (URL de preview, URL de producción, capturas si hace falta).

## 4. Datos y tasas: procedencia

No se inventó ni alteró ninguna tasa, cobertura ni método. Los valores que
ya existían en Supabase (`delivery_methods`, tasas CUP/USD observadas en
la auditoría) se dejaron intactos. Lo único que cambió fue **dónde** vive
la vigencia (antes implícita, ahora `updated_at` + umbrales en
`app_config.rate_fresh_hours` / `rate_stale_hours`, seedeados en 12h/24h
como punto de partida razonable — **el negocio debe confirmar o ajustar
estos umbrales**, no son un dato de auditoría, son una decisión técnica de
esta tarea que debe validarse).

El saludo de WhatsApp `whatsapp_greeting_name` se migró con el valor
observado en producción (`Adonys`) sin alterarlo.

## 5. Integración real vs. no configurada/simulada

| Pieza | Estado |
|---|---|
| Remesas (calculadora, `delivery_methods`, `orders`) | **Real**, ya existía, mejorado en esta tarea |
| `app_config` (saludo, vigencia) | **Real**, tabla nueva en el Supabase real |
| Catálogo (Product Studio One / NEXO) | **`not_configured`** — adaptador real implementado, sin credenciales en este entorno |
| Pedidos de tienda (`createOrder`) | **`not_configured`** — mismo motivo; el carrito es local (localStorage) hasta que haya integración |
| Analítica | No instrumentada con proveedor real en esta tarea (fuera del alcance inmediato; los eventos de la auditoría no tenían instrumentación previa y no se agregó un proveeder para no inventar una decisión de terceros sin aprobación) |

## 6. Próxima tarea sugerida

1. Verificar/promover el deploy (sección 3).
2. Cuando exista contrato con Product Studio One / NEXO: implementar el
   cuerpo real de `NexoCatalogAdapter` (`src/lib/catalog/nexoAdapter.ts`)
   — la interfaz y el resto de la tienda ya están listos para consumirlo.
3. Decidir con el negocio los umbrales de vigencia de tasa (sección 4) y,
   si hace falta, exponerlos en el panel admin (hoy son editables solo por
   SQL/Supabase Studio).
4. Confirmar datos legales pendientes (`/contacto`, `/privacidad`,
   `/terminos`) y reemplazar los avisos "pendiente de configuración".
5. Activar "Leaked Password Protection" en Supabase Auth (aviso menor,
   fuera del alcance de esta tarea).
