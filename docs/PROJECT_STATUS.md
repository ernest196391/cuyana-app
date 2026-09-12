# PROJECT_STATUS — Cuyana

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

Detalle completo, con pasos siguientes, en `docs/HANDOFF.md`.
