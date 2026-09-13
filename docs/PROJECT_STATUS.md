# PROJECT_STATUS — Cuyana

## CUYANA-FOOD-004 — Expansión conservadora (2026-09-13)

- Revalidados y activados 8 productos con fotografía existente: Pollo 10 lb, Frijol negro 1 kg, Azúcar 1 kg, Atún 170 g, Jamonilla 320 g, Mantequilla 200 g, Pasta de tomate 400 g y Penne Rigate 500 g.
- Cada oferta conserva URL exacta, observación vigente por 24 h, costo fuente, disponibilidad, presentación y ETA. Precio público: costo × 1.15; tasa comercial intacta en 245 GYD/USD.
- Bloqueados tras revalidación: Aceite vegetal 1 L (cambió a USD 3.53 y está agotado), Aseo Personal (no se encontró la composición exacta a USD 15.04) y Huevos (la ficha del proveedor no fue verificable de forma fiable).
- Compra de Mamá y Doubledow siguen no comprables; ambos conservan `image_status=needed` y Doubledow no usa una imagen parecida.
- Migración aplicada al Supabase canónico: `20260913072407_cuyana_food_004_catalog_expansion.sql`.

## CUYANA-ACCOUNT-TRACK-001 — Cuenta + Confianza + Seguimiento (2026-09-13)

Bloque del Blueprint §5. Lo confirmado en `main` y producción:

- Registro/login de cliente en `/entrar`, separado de `/admin`.
- `Mi cuenta`: historial de remesas y tienda, cuánto ha enviado, palomita.
- Familiares guardados; rellenan el destino del checkout sin volver a teclear.
- Verificación: carnet por las dos caras a bucket privado + familiar en Cuba.
- `/admin/clientes`: revisión, verificar/rechazar, fijar adelanto. Abrir un
  carnet queda escrito ANTES de firmar el enlace; si no se puede escribir, no
  hay enlace.
- Referidos del cliente verificado. `commission_pct` nace en 0 a propósito.
- Comprobante público `/envio/<ref>` sin cuenta y sin datos de quien envía.
- Cuadre ve si quien pidió está verificado y a quién hay que entregarle.

Seguridad corregida en el camino: `orders` solo dejaba INSERT al rol `anon`
—el primer cliente con sesión no habría podido pedir—; `/admin` solo
comprobaba que hubiera sesión; un `?ref=` inexistente tumbaba el pedido
entero por clave foránea; y `.page-section` anulaba el margen lateral de
toda la web.

**No terminado:** el tracking de tienda no existe y el de remesas no se ha
estrenado (0 saltos en producción). Ver
`docs/AUDITORIA_2026-09-13_TIENDA_Y_ESTADO.md` §2.


## CUYANA-UI-CLOSE-004 — Funcionalmente cerrado (2026-09-13)

- CTA global “Empezar” eliminado; el header queda como navegación contextual.
- Header: símbolo + “Cuyana” a 30 px, sin “Cerca de los tuyos”. Footer: solo símbolo.
- Alimentos abre directamente con el H1; sin eyebrows redundantes. CTA final: “Hablar por WhatsApp” con el número real configurado.
- Producción comprobada: 0 imágenes rotas, 0 placeholders activos, precios Guyana correctos, carrito mixto y enlaces funcionales.
- Limitación de QA: el navegador remoto no expone DevTools al pulsar F12/Ctrl+Shift+M; quedan pendientes únicamente las capturas exactas 360/390/412.

## CUYANA-MOBILE-POLISH-003 — En ejecución (2026-09-13)

- Formato monetario de tienda aislado: `G$7,593` y `US$30.99`; CUP, remesas y fechas conservan sus reglas.
- Portada de Alimentos reducida a información que ayuda a elegir y comprar.
- Tarjetas móviles compartidas con Energía: imagen, nombre limitado, GYD, ETA breve y botón “Añadir”.
- USD y presentación quedan ocultos solo en la cuadrícula móvil; permanecen en ficha y escritorio.
- Los bloques inactivos Aseo, Arma tu combo y Compra según presupuesto salieron del escaparate, sin borrar assets ni datos.
- `CUYANA-FOOD-004` queda pendiente para ampliar el catálogo usando el seed, fuentes, imágenes, URLs y proveedores ya conservados.

## CUYANA-FOOD-002 — Cerrado (2026-09-13)

- Baseline confirmado: `8e7916829a0ae8c326483433156049425d99099a`.
- Alimentos refactorizado para compartir jerarquía, tokens y `ProductCard` con Energía.
- Orden curado: Básicos, Proteína Familiar, Proteína Mixta y Carnes + Aceite. Kiosko queda operativo fuera del escaparate; Compra de Mamá continúa inactiva.
- 17 imágenes FOOD aprobadas, 1200×1200 WebP, publicadas en rutas propias. Los cinco borradores del ZIP no se usaron.
- Tasa comercial independiente activa: 245 GYD/USD, vigente hasta 2026-09-20; panel administrativo con estado y renovación por siete días.
- Sin tasa vigente, tarjetas, fichas y carrito muestran “Precio en actualización” y no permiten confirmar.
- Verificación final: 123/123 tests, TypeScript, lint y build verdes; lint conserva tres warnings antiguos ajenos a FOOD.
- Producción certificada en `https://cuyana-app.vercel.app/tienda/alimentos`: cuatro combos, dos esenciales, 0 imágenes rotas, precios GYD/USD y compra habilitada.
- PR principal #9 y correcciones de runtime #10, #11 y #12 fusionados. El lector comercial usa el proyecto canónico y `no-store` para impedir snapshots obsoletos.

## CUYANA-FOOD-001 — Checkpoint 1 (2026-09-13)

- Baseline auditado: `5af2514afa28f3b928b568481c2a3d6e836254e5`; no se tocaron cuenta/verificación/tracking.
- Plan ejecutable: `docs/CUYANA_FOOD_PLAN_MAESTRO.md`.
- Cimiento multi-proveedor aplicado al Supabase real: proveedores, productos/combos, ofertas, observaciones, auditorías, configuración y snapshots económicos.
- Ocho tablas nuevas con RLS, acceso administrativo y sin permisos `anon`.
- Motor de costo aterrizado, margen 15% y auditoría Antes → Ahora probado.
- Verificación: 113/113 tests, TypeScript, lint y build verdes. Persisten tres warnings antiguos del panel admin.
- Siguiente paso: seed investigado no comprable + manifiesto de imágenes/placeholders.

### Checkpoint 2

- Seed cargado: 5 proveedores, 6 combos, 23 productos, 29 ofertas y 29 observaciones; inicialmente 0 comprables.
- Cinco productos revalidados. La URL de Carnes + Aceite ahora responde 404 y queda bloqueada.
- Catálogo público sanitizado: la tienda no recibe proveedor, URL ni costo fuente.
- `/tienda/alimentos`, fichas y `/admin/abastecimiento` implementados.
- Manifiesto de 12 imágenes creado; no se generaron imágenes.
- 114/114 tests y build verde.

### Checkpoint 3

- Revalidación administrativa automática: extracción JSON-LD, comparación contra la observación anterior, auditoría, caducidad de 24 h y bloqueo de compra ante cambios críticos o stock dudoso.
- Protección de fuentes contra protocolos, hosts privados y redirecciones inseguras.
- Cuarto combo vigente: Combo Kiosko; el catálogo público activo queda en 4 combos + 2 esenciales. Los agotados/404 permanecen fuera de venta.
- Panel operativo capaz de registrar la compra ejecutada contra un pedido real, con costo aterrizado, tasa, margen y reparto 5%/5%/5% en snapshot.
- 123/123 tests, TypeScript y build verdes. Lint conserva únicamente tres warnings preexistentes del panel general.
- Advisors reejecutados: políticas FOOD optimizadas, relaciones indexadas y sin hallazgos de seguridad originados por este bloque; permanecen avisos anteriores de Auth/Cuadre.
- PR #8 mergeado a `main` (`1e24abc769292ef50ca3d81257b623c537daa791`); Vercel producción verde. Certificados HTTP 200 y contenido real en `/tienda/alimentos`, `/producto/combo-kiosko` y `/carrito`.

Última actualización: 2026-09-11T18:00:00Z por Claude Code (CUYANA-WEB-001).

## Resumen

Landing pública de remesas Guyana→Cuba en Next.js 14 (App Router) +
Supabase (proyecto `cuyana`, id `dkiiknsfbefpkrnmbzid`), con panel admin en
`/admin`. Este ciclo aplicó el rebranding Cuyana del paquete adjunto,
corrigió los defectos P0 de la auditoría 2026-09-11, remodeló la portada en
tres caminos (dinero/alimentos/energía), añadió una fachada de tienda con
adaptador de catálogo, SEO técnico y páginas legales.

## Estado por fase (CUYANA-WEB-001)

- [x] **Fase A — Preflight**: baseline build/lint/typecheck verde antes de
      cambiar código. Repo, Supabase y estructura real inspeccionados.
- [x] **Fase B — Sistema de marca**: tokens exactos del brand guide
      integrados en `globals.css` (`--cuyana-*` + alias). Tipografía
      Playfair Display (títulos) + Inter (interfaz); JetBrains Mono
      reservado a cifras (decisión documentada). Logo SVG real copiado a
      `public/brand/cuyana/`, usado en header, footer y login admin.
      Favicon/apple-icon/OG regenerados con los assets corregidos vía
      convención de archivos de Next (`src/app/icon.png`,
      `apple-icon.png`, `opengraph-image.png`) + `manifest.ts` (PWA).
- [x] **Fase C — Portada de tres caminos**: header, hero (H1 exacto "Cerca
      de los tuyos.", copy del prompt maestro), selector de necesidad (3
      tarjetas pulsables), sección remesas con la calculadora real (sin
      duplicar lógica: mismo componente en `/` y `/enviar-dinero`),
      secciones alimentos/energía con estado honesto si el catálogo no
      está conectado, cómo funciona, confianza y ayuda, footer. Móvil:
      texto → CTA → imagen; sin carruseles ni texto sobre rostros.
- [x] **Fase D — Flujo de remesas (P0)**:
  - P0-1 (CTA sin nombre/teléfono): el CTA ahora es `aria-disabled` y su
    `onClick` bloquea la navegación mientras el formulario sea inválido
    (antes solo se prevenía tras el clic).
  - P0-2 (teléfono ausente del mensaje): `construirMensajeRemesa` incluye
    el WhatsApp del remitente. Cubierto por prueba.
  - P0-3 ("tasa de hoy" vencida): reemplazado por estados
    vigente/por_vencer/vencida (`rateFreshnessStatus`), derivados de
    `updated_at` + umbrales configurables en `app_config`
    (`rate_fresh_hours`, `rate_stale_hours`). Con tasa vencida, el CTA
    exige una confirmación explícita antes de continuar.
  - Saludo "Hola Adonys" migrado a `app_config.whatsapp_greeting_name`
    (mismo valor observado, ahora editable sin desplegar código).
  - Lógica de validación/mensaje extraída a `src/lib/remesaMessage.ts`
    (pura, testeada).
- [x] **Fase E — Fachada de tienda**: rutas `/tienda`, `/tienda/alimentos`,
      `/tienda/energia`, `/producto/[slug]`, `/carrito`, `/pedido/[codigo]`.
      `CatalogProvider` (`src/lib/catalog/`) con adaptador NEXO real que
      devuelve `not_configured` sin credenciales (no hay `NEXO_CATALOG_URL`
      / `NEXO_CATALOG_API_KEY` en este entorno). Fixtures solo fuera de
      producción. Sin iframe ni redirección visible a NEXO.
- [x] **Fase F — Supabase**: migración aplicada directamente al proyecto
      real (`dkiiknsfbefpkrnmbzid`) vía MCP y versionada en
      `supabase/migrations/20260911173650_rebranding_config_vigencia_y_rls.sql`:
      corrige políticas RLS duplicadas/permisivas (ver Riesgos — hallazgo
      de seguridad real), añade `app_config` (RLS: lectura pública,
      escritura solo admin) y `delivery_methods.rate_source`. Advisor de
      seguridad de Supabase limpio salvo un ajuste de Auth no relacionado
      (ver Riesgos).
- [x] **Fase G — SEO/legal**: `robots.ts` y `sitemap.ts` (App Router,
      responden 200), `/contacto`, `/privacidad`, `/terminos`, `/ayuda`
      con contenido honesto (datos legales marcados como pendientes, no
      inventados). Metadata/OG/canonical por página. Cierra P1-4.
      Instrumentación mínima del embudo (`src/lib/analytics.ts`, cierra
      P1-5): `need_selected`, `remesa_method_selected`,
      `remesa_whatsapp_click`, `store_add_to_cart`,
      `store_checkout_requested`. Sin PII; se degrada a no-op si no hay
      `window.plausible`/`window.gtag` configurado (no se eligió
      proveedor sin aprobación del negocio).
- [x] **Pruebas automatizadas**: Vitest añadido (`npm test`), 31 pruebas
      en 3 suites (`format.test.ts`, `remesaMessage.test.ts`,
      `rateFreshness.test.ts`) cubriendo cálculo, redondeo, vigencia,
      validación del formulario y serialización del mensaje de WhatsApp.
      Verificación manual con Playwright headless a 360/390/412/1280px:
      sin scroll horizontal (se encontró y corrigió un desborde real de
      grid en móvil antes de cerrar la tarea).
- [ ] **Despliegue y verificación en producción**: bloqueado en este
      entorno — ver Riesgos. Build/lint/typecheck/tests verdes localmente;
      falta la verificación en Vercel/producción real.

## Riesgos / bloqueos (externos, no de código)

1. **Sin acceso efectivo a Vercel ni a la red pública desde esta sesión.**
   `mcp__Vercel__list_teams` devuelve `[]` (no hay equipo/proyecto
   accesible) y el proxy de red de este entorno bloquea explícitamente
   `cuyana.casavivadecuba.com` (`EGRESS_BLOCKED`). No se pudo:
   - confirmar el estado de producción antes de este cambio;
   - disparar ni verificar un deploy de preview/producción;
   - hacer el smoke test móvil sobre la URL pública real.
   El código está pusheado a `claude/cuyana-rebranding-ecommerce-t1bse7`;
   si el proyecto Vercel ya sigue esa rama por integración Git (la
   auditoría confirma stack Next.js sobre Vercel), un preview debería
   generarse solo. **Se necesita que alguien con acceso al dashboard de
   Vercel (o una sesión con egress habilitado) confirme el preview y
   promueva/verifique producción.**
2. **Hallazgo de seguridad corregido en Supabase**: varias tablas
   (`delivery_methods`, `offers`, `rate_method_history`) tenían una
   política RLS amplia (`with_check`/`qual = true` para cualquier usuario
   `authenticated`) conviviendo con una política restringida al email del
   admin. Como las políticas permisivas de Postgres se combinan con OR,
   la amplia anulaba la restrictiva: cualquier cuenta autenticada (no solo
   el admin) podía escribir tasas y métodos. Corregido en la migración de
   esta tarea. Recomendado revisar si el registro público de usuarios está
   abierto en Supabase Auth (fuera del alcance de esta tarea, no se tocó).
3. **Sin credenciales de Product Studio One / NEXO** en este entorno: el
   adaptador de catálogo queda en `not_configured` a propósito (ver
   `src/lib/catalog/nexoAdapter.ts`). No bloquea el resto de la tarea.
4. Aviso menor de Supabase Advisors no relacionado con este cambio:
   "Leaked Password Protection Disabled" en Auth — recomendado activarlo,
   fuera del alcance de `CUYANA-WEB-001`.

## CUYANA-WEB-002 — Catálogo de energía (NEXO, solo lectura) + checkout Cuyana

- [x] Adaptador `NexoCatalogAdapter` real para "energía": lee
      `NEXO_CATALOG_URL` (endpoint público de NEXO), filtra por categoría
      replicando la lógica real de NEXO (no el parámetro `category` de su
      API, que espera un ID numérico), resuelve imágenes relativas contra
      el origin de NEXO. "alimentos" sigue `not_configured` a propósito.
- [x] Tasa comercial GYD/USD propia de la tienda (`commercial_rates`),
      independiente de la tasa de remesas, con vigencia; sin fila inicial
      inventada — sin ella, el precio se muestra solo en USD.
- [x] Checkout server-side (`POST /api/store/order`): revalida precio
      contra el catálogo en vivo, persiste en `store_orders` (Supabase de
      Cuyana) y solo entonces habilita el mensaje de WhatsApp con marca
      Cuyana hacia `5355879222`. Nunca usa el checkout ni las gestoras de
      NEXO; nunca escribe en WooCommerce.
- [x] `npm run build`/`lint`/`tsc --noEmit`/`vitest run` verdes (57/57
      pruebas).
- [ ] **Verificación en vivo contra NEXO**: bloqueada en este entorno — el
      proxy de egress rechaza `nexotienda.casavivadecuba.com`
      (`connect_rejected`), mismo tipo de bloqueo ya documentado para
      Vercel/`cuyana.casavivadecuba.com` en CUYANA-WEB-001. Ver
      `docs/HANDOFF.md` §3.
- [ ] **Puesta en producción y certificación (2026-09-12T03:30:00Z)**:
      intentada, bloqueada antes de tocar Vercel. `mcp__Vercel__list_teams`
      devuelve `[]`, `web_fetch_vercel_url` da `403 Forbidden` sobre
      `cuyana.casavivadecuba.com` — esta sesión no tiene acceso real al
      proyecto Vercel. `WebFetch` confirma `EGRESS_BLOCKED` para
      `nexotienda.casavivadecuba.com` y también para
      `cuyana.casavivadecuba.com` por igual (política de red de este
      entorno, no un problema del lado de NEXO: su propio audit ya había
      registrado ese dominio como `200 funcional`). Commit listo para
      desplegar: `dbeef7144efbb8b3bf31c3afadfaa97b6f747f4f`
      (`claude/ecstatic-ramanujan-iv70r6`). Pasos exactos para quien tenga
      acceso al dashboard, en `docs/HANDOFF.md` §6-7.
- [x] **Merge a `main`** (2026-09-12T03:58:33Z, por `ernest196391`):
      PR #1 y PR #2 mergeados. Merge commit `e403f54735f1bdcdceb49d8a49d1bc7e5a3abc82`.
      Vercel construyó el Preview del PR #2 con éxito (`Ready`).
- [x] **Certificación en producción (parcial, 2026-09-12T15:35:00Z)**:
      usuario reautorizó Vercel. Confirmado en vivo contra
      `cuyana.casavivadecuba.com`: build de producción sin errores, sin
      errores de runtime en 24h, `/tienda/energia` y `/carrito` responden
      `200` con el estado honesto `not_configured` (sin `NEXO_CATALOG_URL`
      todavía), `gydPerUsd: null` fluye correctamente al carrito sin
      romper nada, dominio custom sin muro de autenticación de Vercel.
      Detectado (sin colisión, verificado por diff) un deployment más
      nuevo de otra sesión de Claude (`59c39c3`, integración con "Cuadre"
      para remesas) por encima de mi merge — no toca ningún archivo de
      esta tarea.
- [x] **`NEXO_CATALOG_URL` configurada y catálogo real en producción
      (2026-09-12T15:51:00Z)**: usuario cargó la variable y redesplegó.
      Verificado en vivo: `/tienda/energia` muestra 19 productos reales de
      NEXO (paneles, BLUETTI, EcoFlow, SUMRY, SIGMA, etc.) con precio en
      USD, imágenes resueltas correctamente (absolutas y relativas), y la
      ficha de producto completa y funcional. Cero errores de build o
      runtime. Detalle en `docs/HANDOFF.md` §10.
- [x] **Auditoría UX + corrección (2026-09-12T16:10:00Z)**: el usuario
      probó en su teléfono y encontró que agregar al carrito no llevaba a
      ningún lado — el header no tenía ningún acceso a `/carrito`.
      Corregido: ícono de carrito con contador en el header
      (`CartIndicator`), aviso de confirmación con salida directa al
      carrito (`CartToast`), stepper de cantidad (ficha y carrito), barra
      de acción fija en móvil, y pantalla de confirmación con el código
      de pedido (WhatsApp se abre en pestaña nueva, ya no navega fuera).
      Detalle completo en `docs/HANDOFF.md` §11.
- [x] **Bug real corregido: "No se pudo registrar el pedido"
      (2026-09-12T16:40:00Z)**: causa raíz reproducida en la base real —
      `store_orders` pedía de vuelta (`RETURNING`) la fila recién creada
      para confirmar el pedido, y RLS exige poder *leer* esa fila para
      eso; el cliente (anon) no puede. Corregido generando código/id en
      el servidor antes de insertar, sin depender de `RETURNING`.
      Verificado con una prueba SQL directa como rol `anon`.
- [x] **Rediseño de ficha de producto y carrito (auditoría de diseño del
      usuario)**: imagen contenida en vez de ocupar la pantalla completa
      (mismo patrón `fill`+`aspect-ratio` que las tarjetas), barra fija
      de "Añadir al carrito" en móvil, ícono de papelera en vez de texto
      "Quitar". Detalle en `docs/HANDOFF.md` §12-13.
- [ ] **Pendiente, requiere info externa (no un bug ni una decisión que se
      pueda tomar desde el código)**: usuario confirmó que sí quiere el
      pedido de tienda también en Cuadre. `src/app/api/cuadre/route.ts` es
      solo para remesas (exige monto en GYD y método de entrega); un
      pedido de tienda no tiene ninguno de los dos. Hace falta saber si el
      backend real de Cuadre tiene/puede tener un endpoint para pedidos de
      producto en USD antes de construir algo — no se inventó un formato a
      ciegas. Detalle en `docs/HANDOFF.md` §14.
- [ ] **Pendiente (prueba manual, no automatizable con las herramientas
      disponibles)**: repetir el checkout completo en el teléfono tras el
      próximo merge, para confirmar que el pedido ya se guarda sin error
      y que el WhatsApp llega a `5355879222` con marca Cuyana.

Detalle completo, con pasos siguientes, en `docs/HANDOFF.md`.
