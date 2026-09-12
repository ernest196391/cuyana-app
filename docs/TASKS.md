# TASKS — Cuyana

Registro de tareas reclamadas por agentes (Claude Code, ChatGPT Work u otros).
Antes de tocar código: revisa si tu alcance ya está tomado. Si lo está, divide por
archivos o toma la siguiente tarea libre y déjalo escrito aquí.

## En curso

### CUYANA-WEB-001 — Remodelación, rebranding y base comercial ejecutable

- **Agente:** Claude Code (sesión `session_01Y7hkVKc2C7hFG1KPakFM81`)
- **Reclamada:** 2026-09-11T17:30:00Z (UTC)
- **Rama:** `claude/cuyana-rebranding-ecommerce-t1bse7`
- **SHA base:** `d49d0ca7856b949737fe48bbe50d1f186c88c711`
- **Alcance de archivos:**
  - `src/app/**` (portada, layout, metadata, rutas nuevas: `/enviar-dinero`,
    `/tienda*`, `/producto/[slug]`, `/carrito`, `/pedido/[codigo]`,
    `/contacto`, `/privacidad`, `/terminos`, `/ayuda`, `robots.ts`,
    `sitemap.ts`)
  - `src/components/**` (Header, Footer, tarjetas de selección, marca)
  - `src/lib/**` (config de marca/mensajería, adaptador de catálogo,
    utilidades de tasa/vigencia)
  - `public/brand/cuyana/**` (activos de marca corregidos)
  - `supabase/migrations/**` (nuevas migraciones versionadas)
  - `docs/**` (coordinación)
  - Tests nuevos (`*.test.ts`) y config de test runner
- **No toca:** `src/app/admin/**` salvo lo estrictamente necesario para
  exponer configuración nueva (saludo de WhatsApp, vigencia de tasa) sin
  romper el panel existente.
- **Estado:** implementación completa (fases A–G) y pusheada. Despliegue
  y verificación en producción bloqueados por falta de acceso a
  Vercel/red pública desde esta sesión — ver `docs/HANDOFF.md` §3 para el
  siguiente paso. Ver `docs/PROJECT_STATUS.md` para detalle por fase.

### CUYANA-WEB-002 — Catálogo de energía consumido de NEXO (solo lectura) + checkout propio Cuyana

- **Agente:** Claude Code (sesión `session_011YVe5XSew1neZgVdirhS38`)
- **Reclamada:** 2026-09-12T03:00:00Z (UTC)
- **Rama:** `claude/ecstatic-ramanujan-iv70r6`
- **SHA base:** `7ca1b803c924f4964ad4698e498456c40fceef32`
- **Alcance de archivos:**
  - `src/lib/catalog/nexoAdapter.ts`, `nexoCategories.ts`, `nexoProducts.ts`,
    `commercialRate.ts` (+ tests)
  - `src/lib/store/**` (mensaje y persistencia de pedido de tienda, nuevo)
  - `src/app/api/store/order/route.ts` (nuevo, checkout servidor)
  - `src/app/(public)/carrito/**`, `src/app/(public)/tienda/**`,
    `src/app/(public)/producto/[slug]/page.tsx` (repricing en vivo, `force-dynamic`)
  - `src/lib/cart.ts`, `src/components/store/AddToCartButton.tsx` (categoría en el carrito)
  - `next.config.mjs` (dominios de imagen de NEXO)
  - `supabase/migrations/20260912030637_tienda_pedidos_y_tasa_comercial.sql`
  - `docs/**`
- **No toca:** checkout/gestoras de NEXO, WooCommerce (nunca se escribe ahí),
  `src/app/admin/**`, la tasa de remesas (`rate_config`/`delivery_methods`).
- **Auditoría previa (evidencia, no suposición):** confirmado por código en
  `ernest196391/ernesto-rondon-nexo` que la plataforma real es WooCommerce
  (no "B/Google Commerce"), que solo produce en USD, que su checkout propio
  y su sistema de "gestoras" siempre abren el WhatsApp de NEXO
  (`5354056173`) — nunca el de Cuyana — y que su endpoint público
  `/api/marketplace/products` no filtra por categoría vía query param (ese
  parámetro espera un ID numérico de WooCommerce, no un slug). Por eso Cuyana
  replica el filtrado real de categorías (`nexoCategories.ts`) y nunca usa el
  checkout/gestoras de NEXO.
- **Nota de coordinación:** el roadmap de NEXO (`docs/ROADMAP.md` de ese
  repo, bloque 7 "Cuyana ecommerce como canal de marca blanca", tarea
  `PS1-B01-T01`) ya cubre este mismo trabajo **del lado NEXO**, reclamada
  por otro agente (ChatGPT) en ese repositorio. Esta tarea es estrictamente
  del lado `cuyana-app` y no edita nada en `ernesto-rondon-nexo`.
- **Drift detectado (no provocado por esta tarea):** el Supabase real
  (`dkiiknsfbefpkrnmbzid`) tiene 5 migraciones aplicadas
  (`cuadre_esquema_parte1..4`, `cuadre_cerrar_anon_del_esquema`,
  2026-09-12) que no existen como archivo en `supabase/migrations/` de este
  repo. Viven en un esquema aparte (`cuadre.*`), sin colisión con las
  tablas de esta tarea (`public.commercial_rates`, `public.store_orders`).
  No se tocaron ni se investigaron más a fondo por estar fuera de alcance;
  se deja constancia para quien las reclamó.
- **Estado:** implementación completa del flujo mínimo (catálogo de
  energía → ficha → carrito → checkout → pedido persistido → WhatsApp
  Cuyana). Migración aplicada al Supabase real. `npm run build`/`lint`/
  `tsc --noEmit`/`vitest run` verdes (57/57 pruebas). **Bloqueado**: no se
  pudo verificar en vivo contra `https://nexotienda.casavivadecuba.com` —
  el proxy de egress de este entorno lo rechaza (`connect_rejected`, mismo
  tipo de bloqueo ya documentado para `cuyana.casavivadecuba.com` en
  CUYANA-WEB-001). Ver `docs/HANDOFF.md` para el detalle y el siguiente
  paso.

## Libres / futuras

- Verificar en producción/Vercel el consumo real del catálogo NEXO (bloqueado
  en este entorno por red — ver CUYANA-WEB-002).
- Configurar `commercial_rates` (tasa GYD/USD comercial) desde Supabase: hoy
  no tiene fila a propósito, la tienda muestra USD solamente.
- Extender el mapeo de categorías NEXO↔Cuyana a "alimentos" cuando exista un
  mapeo real confirmado (hoy `not_configured` a propósito).
- Analítica con proveedor real (placeholder de eventos implementado, sin
  proveedor conectado).
