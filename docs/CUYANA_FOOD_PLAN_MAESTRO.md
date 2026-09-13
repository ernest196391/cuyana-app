# CUYANA-FOOD-001 — Plan maestro ejecutable

Estado: EN EJECUCIÓN  
Rama: `work/cuyana-food-001`  
Baseline auditado: `5af2514afa28f3b928b568481c2a3d6e836254e5`

## Resultado buscado

CUYANA venderá alimentos, combos y hogar sin inventario propio inicial. El cliente compra a CUYANA; un operador revalida y compra manualmente al proveedor elegido; CUYANA conserva el pedido, el precio cobrado, el costo real y el seguimiento.

No se construye otra tienda. Se reutilizan el catálogo, carrito, checkout, beneficiario, mensajería, pedido y puente a Cuadre existentes.

## Límites de esta ejecución

- No modificar auth, cuenta, carnet, confianza, crédito ni tracking.
- No generar imágenes. Sí preparar slots, briefs, estados y placeholders.
- No automatizar compras externas.
- No publicar productos amarillos ni datos que no hayan sido revalidados.
- No copiar imágenes ni textos de proveedores.

## Fuente de verdad

1. Código, migraciones y servicios reales.
2. Este plan y el Blueprint vivo del repositorio.
3. Blueprint Maestro V5 entregado por el usuario.
4. Investigación de catálogo del 2026-09-12.

Si difieren, el código real gana en arquitectura; el Blueprint V5 gana en decisiones de negocio que no contradigan cambios posteriores.

## Bloques y checkpoints

### A. Auditoría y coordinación — COMPLETADO

- [x] Comparar `main` con el corte `cde6581`.
- [x] Confirmar HEAD `5af2514`.
- [x] Confirmar que los commits nuevos pertenecen a cuenta/verificación/tracking.
- [x] Abrir rama aislada.
- [x] Actualizar los documentos de continuidad al cerrar el checkpoint.

### B. Contrato de datos de abastecimiento — COMPLETADO

- [x] Proveedores y capacidades de fulfillment.
- [x] Productos CUYANA y combos.
- [x] Ofertas múltiples por producto.
- [x] Observaciones inmutables por URL.
- [x] Auditorías Antes → Ahora y severidad configurable.
- [x] Snapshot económico de compra asociado a `store_orders`.
- [x] RLS: ninguna tabla operativa legible por público.

### C. Seed de investigación — P0

- [x] Importar candidatos como investigación, nunca como stock permanente.
- [x] Separar `GREEN`, `GREEN_DRAFT`, `YELLOW` y `RED`.
- [x] Mantener `purchasable=false` hasta revalidación.
- [x] Cargar cinco proveedores, seis combos y 23 productos del corte.

### D. Motor puro — P0

- [x] Calcular costo aterrizado y reparto 5% + 5% + 5%.
- [x] No hardcodear tasa GYD/USD.
- [x] Clasificar cambios de precio/stock/composición/SLA/cobertura.
- [x] Bloquear publicación si la revalidación es insuficiente o crítica.
- [x] Pruebas unitarias.

### E. Pipeline visual sin crear imágenes — P0

- [x] `image-manifest.json` para primeros 12 activos.
- [x] Placeholder estable y nunca imagen rota.
- [x] Diferenciar combo, genérico y modelo exacto.
- [x] Rutas finales WebP 1200×1200.

### F. Catálogo y experiencia — P0

- [x] Adaptador de alimentos respaldado por catálogo público sanitizado.
- [x] `/tienda/alimentos` con máximo cuatro combos destacados.
- [x] Productos esenciales.
- [x] Fichas con composición, sustitución, cobertura, entrega y CTA móvil.
- [x] `Arma tu combo` y presupuesto visibles solo como próximos pasos hasta existir motor real.

### G. Operación — P0

- [x] Vista protegida para elegir proveedor y abrir URL exacta.
- [x] Revalidación obligatoria antes de comprar.
- [x] Alternativas ordenadas.
- [x] Guardar snapshot de costo, tasa, reparto y URL comprada.
- [x] Compra final manual.

### H. QA, entrega y publicación — P0

- [x] Build, lint, typecheck y tests.
- [x] 360, 412, tablet y desktop (layout responsive validado en build/local; rutas reales certificadas en producción).
- [x] Carrito, checkout, mensajería y pedido.
- [x] Sin imágenes rotas.
- [x] Documentos de estado y handoff.
- [x] Commit, push, PR/merge y verificación de producción.

## Reglas comerciales congeladas para el MVP

`landed_cost = supplier_price + supplier_shipping + payment_fx_fee + unavoidable_logistics`

`sale_price_usd = landed_cost × 1.15`

El 15% se distribuye en tres participaciones de 5%: Ernesto, Adonys y CUYANA. La mensajería CUYANA y la urgencia se calculan aparte. La tasa GYD/USD se lee de configuración vigente y se guarda como snapshot.

## Definición de terminado

El bloque termina cuando existe un catálogo operativo de 4–6 combos y aproximadamente 20–30 productos, cada oferta activa tiene fuente y observación vigente, el checkout revalida precios en servidor, el operador sabe dónde comprar y cuánto gana cada parte, no hay imágenes rotas y toda la ruta principal pasa QA.

## Siguiente acción exacta

Bloque cerrado. Revalidar las ofertas activas antes de que cumplan 24 horas y sustituir placeholders únicamente con imágenes verificadas del pipeline visual separado.
