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

## Libres / futuras

- Integración real server-to-server con Product Studio One / NEXO
  (credenciales aún no configuradas — bloqueada externamente).
- Analítica con proveedor real (placeholder de eventos implementado, sin
  proveedor conectado).
