# HANDOFF — CUYANA-WEB-002

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
