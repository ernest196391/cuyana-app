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

## 2026-09-11 — Vercel

El MCP de Vercel de esta sesión no devuelve equipos/proyectos
(`list_teams` → `[]`), por lo que no se puede desplegar ni verificar
producción directamente desde aquí. Se asume que el proyecto tiene
integración Git→Vercel ya configurada (auditoría confirma stack Next.js
sobre Vercel en producción) y que el push a la rama dispara un preview
automático. Ver `docs/HANDOFF.md` para el bloqueo exacto.
