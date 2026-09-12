# DECISIONS — Cuyana

Decisiones de diseño/arquitectura tomadas durante `CUYANA-WEB-001`, con su
razón, para que otro agente no las deshaga sin contexto.

## 2026-09-11 — Fuente de marca

Se usa exclusivamente el paquete `cuyana-claude-code-package` adjunto
(`CUYANA-BRAND-GUIDE.md`, `tokens/cuyana.css`, `tokens/cuyana.tokens.json`,
`assets/brand/*.svg`, `assets/web/*`, `assets/campaign/*.webp`) como fuente
técnica de marca. No se usan los PNG del ZIP original (recortes defectuosos
del brand board) ni colores extraídos de capturas. Valores exactos:
burdeos `#7A0E2E`, burdeos oscuro `#520B24`, dorado `#D4A017`, oscuro
`#1F1B1D`, crema `#F8F4ED`. Tipografía: Playfair Display (títulos/logo) +
Inter (interfaz).

## 2026-09-11 — La calculadora no se duplica

La lógica de la calculadora de remesas (`src/components/Calculator.tsx`) se
mantiene como componente único. Se monta en `/enviar-dinero` y también en un
módulo directo de portada (mismo componente, sin copiar lógica).

## 2026-09-11 — Tienda como fachada con adaptador, no integración simulada

Se implementa `CatalogProvider` (`src/lib/catalog/`) con estado explícito
`not_configured` mientras no existan credenciales reales de Product Studio
One / NEXO. En producción no se muestran productos inventados: se muestra
"Catálogo en preparación" con contacto. Fixtures de desarrollo solo se
activan con `NODE_ENV !== "production"` o una bandera explícita, nunca por
defecto en producción.

## 2026-09-11 — Vigencia de tasas

Se añaden migraciones para registrar vigencia/expiración de las tasas
(`valid_until`, `source`) en vez de asumir "tasa de hoy" como si nunca
venciera. El texto de vigencia en la UI deriva de estas columnas y del
`updated_at` existente, no de una fecha fija en código.

## 2026-09-11 — Saludo de WhatsApp configurable

El saludo "Hola Adonys" estaba hardcodeado en `Calculator.tsx`. Se mueve a
configuración (tabla `app_config`, clave `whatsapp_greeting_name`) con
fallback neutro ("Hola,") si no hay valor configurado. No se inventa un
nombre nuevo.

## 2026-09-12 — Integración con NEXO: solo lectura de catálogo, nunca su checkout

Auditoría de código (no suposición) de `ernesto-rondon-nexo` confirmó
WooCommerce real por debajo, y que tanto su checkout propio como su sistema
de "gestoras" (canales de marca blanca sobre el mismo catálogo) siempre
abren el WhatsApp de NEXO (`5354056173`), nunca el del canal. Eso no sirve
para Cuyana: el pedido tiene que llegar al WhatsApp de Cuyana
(`5355879222`) con marca Cuyana. Por eso `NexoCatalogAdapter` solo lee
catálogo (`GET /api/marketplace/products`, público, sin credenciales hoy) y
Cuyana arma y persiste su propio pedido — nunca se usa el checkout ni las
gestoras de NEXO, y nunca se escribe nada en WooCommerce.

## 2026-09-12 — Filtrado de categoría "energía" replicado, no delegado al query param de NEXO

El parámetro `category` del endpoint público de NEXO espera un ID numérico
de WooCommerce, no un slug (`?category=energia` no filtra nada). La propia
tienda NEXO tampoco lo usa: trae todo y filtra en cliente por nombre de
categoría. `src/lib/catalog/nexoCategories.ts` replica exactamente esa
lista (`"energia solar"`, `"paneles solares"`, `"energia"`). Solo "energía"
tiene mapeo confirmado hoy; "alimentos" sigue `not_configured` a propósito
hasta confirmar uno real.

## 2026-09-12 — Tasa comercial GYD/USD de la tienda: propia, manual, con vigencia

Nueva tabla `public.commercial_rates` (fila `gyd_usd`), completamente
separada de `rate_config`/`delivery_methods` (tasa de remesas). No se
insertó ningún valor inicial: mientras no exista fila, o si `expires_at` ya
pasó, el precio se muestra solo en USD (`src/lib/catalog/commercialRate.ts`
+ `formatProductPrice`, ya existente). El admin la configura manualmente
desde Supabase (Studio o SQL) — no hay UI de admin para esto en esta tarea.

## 2026-09-12 — Pedido de tienda: persistido en Supabase antes de abrir WhatsApp, precio revalidado en servidor

Nueva tabla `public.store_orders` (separada de `orders`, que es remesas).
El checkout corre en `POST /api/store/order` (servidor, nunca en el
navegador): ahí se vuelve a resolver el precio de cada línea contra el
catálogo NEXO en vivo — nunca se confía en el precio que mande el
navegador — y solo si el pedido queda guardado con un código real se arma
el mensaje de WhatsApp (`construirMensajePedidoTienda`) hacia
`5355879222`, con marca e identidad Cuyana, sin mencionar NEXO. Si falla el
guardado, no se abre WhatsApp con datos inventados: se muestra un error y
un enlace de contacto genérico, igual que el resto de la tienda.

## 2026-09-12 — Páginas de tienda/carrito/producto forzadas a dinámicas

`CategoryPage`, `/producto/[slug]` y `/carrito` leen catálogo y tasa
comercial en vivo. Sin `export const dynamic = "force-dynamic"`, Next.js las
prerrenderiza como HTML estático en el momento del build (comprobado: sin
esto, salían como `○ Static` incluso usando `fetch(..., {cache:"no-store"})`
dentro del adaptador, porque en este entorno de build no hay
`NEXO_CATALOG_URL` configurada y ese código nunca se ejecuta). Se fuerza
explícitamente para que precio, stock e imagen se sirvan siempre en vivo en
producción.

## 2026-09-11 — Vercel

El MCP de Vercel de esta sesión no devuelve equipos/proyectos
(`list_teams` → `[]`), por lo que no se puede desplegar ni verificar
producción directamente desde aquí. Se asume que el proyecto tiene
integración Git→Vercel ya configurada (auditoría confirma stack Next.js
sobre Vercel en producción) y que el push a la rama dispara un preview
automático. Ver `docs/HANDOFF.md` para el bloqueo exacto.
