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
