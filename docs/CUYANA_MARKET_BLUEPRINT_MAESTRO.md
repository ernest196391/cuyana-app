# CUYANA MARKET — BLUEPRINT MAESTRO

Última actualización: 2026-09-12
Estado: FUENTE DE VERDAD para la expansión de CUYANA hacia alimentos, combos configurables, inteligencia de precios, proveedores, checkout y conciliación.

## 0. Regla principal

Este documento manda para Cuyana Market. Si una IA, Claude Code, ChatGPT Work u otro agente continúa el proyecto, debe leer primero este archivo y después `docs/PROJECT_STATUS.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` y `docs/TASKS.md`.

No crear sistemas paralelos si una capacidad ya existe. Reutilizar CUYANA, Product Studio/NEXO, Supabase y Cuadre con responsabilidades separadas.

---

## 1. Objetivo de negocio

CUYANA ayuda a una persona en Guyana a resolver necesidades concretas de su familia en Cuba. Para alimentos y productos de hogar, el modelo inicial es de preventa bajo pedido, sin inventario propio obligatorio:

1. El cliente en Guyana elige un combo, arma su propio combo o indica cuánto quiere gastar.
2. CUYANA calcula el precio comercial en GYD.
3. El cliente confirma y paga antes de la compra en Cuba.
4. Adonys adquiere el USDT en Guyana al costo operativo real.
5. En Cuba se recibe el valor de compra disponible.
6. Se compran físicamente los productos en mipymes/proveedores cercanos o seleccionados por el motor de precios.
7. El pedido se prepara en Nuevo Vedado.
8. Se entrega al destinatario en Cuba.
9. Se registra el pedido, costo real, mensajería, margen y reparto.

Principio: CUYANA vende solución y cumplimiento, no una promesa falsa de inventario fijo.

---

## 2. Reglas económicas iniciales

### 2.1 Costos y conversión

- Costo operativo de referencia de Adonys: `1 USDT = 245 GYD`.
- En Cuba, referencia operativa actual: `1 USDT ≈ 1 USD efectivo` hasta que se documente una conversión mejor.
- Las tasas de remesas NO se usan para calcular los productos de Cuyana Market.
- Las tasas de remesas continúan siendo un negocio separado.

### 2.2 Margen comercial de Cuyana Market

Margen inicial sobre el costo real de la mercancía: **15%**.

Reparto del 15%:

- 5% para Lennys/operación Cuba.
- 5% para Adonys/operación Guyana.
- 5% queda en CUYANA como margen del negocio.

Fórmula inicial:

`precio_base_venta = costo_real_mercancia * 1.15`

La mensajería no forma parte del 15% y se suma aparte según la dirección de entrega.

Los suplementos por urgencia tampoco forman parte del margen base.

### 2.3 Entrega

- Estándar: 24-48 horas.
- Prioritaria: <=24 horas, con suplemento configurable.
- Mismo día: premium, sujeto a horario, disponibilidad y zona.

Los suplementos deben ser reglas configurables desde administración, no constantes enterradas en código.

---

## 3. Arquitectura de responsabilidades

### 3.1 CUYANA APP — experiencia del cliente y operación comercial

Responsable de:

- escaparate Guyana -> Cuba;
- categorías alimentos, energía y servicios;
- combos prearmados;
- herramienta `Arma tu combo`;
- herramienta `Dime cuánto quieres gastar`;
- carrito;
- checkout;
- captura de destinatario y dirección;
- cálculo de mensajería;
- niveles de urgencia;
- almacenamiento del pedido en Supabase Cuyana;
- seguimiento del estado del pedido;
- salida final por WhatsApp cuando corresponda;
- mostrar precios en GYD y, cuando convenga, equivalencia informativa en USD.

CUYANA no debe duplicar el motor de inteligencia de producto si Product Studio puede suministrarlo.

### 3.2 PRODUCT STUDIO ONE / NEXO — inteligencia de producto y catálogo

Responsable de:

- ficha maestra de producto;
- normalización de nombre, unidad, categoría, imagen y descripción;
- proveedores;
- precios observados;
- fuentes y fecha de comprobación;
- disponibilidad;
- calidad/confianza del proveedor;
- historial de precios;
- reglas de margen;
- precio recomendado;
- combos como composiciones de productos;
- publicación de catálogo consumible por CUYANA.

Situación transitoria: CUYANA ya consume el catálogo de energía de NEXO en modo solo lectura. La arquitectura de alimentos debe seguir el mismo principio: Product Studio/NEXO produce datos; CUYANA vende.

### 3.3 CUADRE — contabilidad operativa y conciliación

Responsable de recibir operaciones ya confirmadas y permitir registrar:

- pedido;
- ingreso en GYD;
- costo USDT;
- costo real de mercancía;
- mensajería;
- suplementos;
- margen bruto;
- 5% Lennys;
- 5% Adonys;
- 5% CUYANA;
- diferencia real contra el cálculo previsto;
- estado de cobro/pago/entrega.

No forzar pedidos de tienda dentro del endpoint actual de remesas si el modelo de datos no coincide. Crear un flujo/endpoint específico para comercio cuando Cuadre lo soporte.

---

## 4. Fuentes de verdad

Cada dato debe tener un único dueño:

| Dato | Fuente de verdad |
|---|---|
| Producto, categoría, imagen, proveedor | Product Studio / NEXO |
| Precio observado y fuente | Product Studio / NEXO |
| Precio recomendado | Motor de pricing de Product Studio |
| Margen comercial CUYANA | Configuración comercial CUYANA/Product Studio |
| Tasa comercial GYD/USD o GYD/USDT | CUYANA `commercial_rates` |
| Tasa de remesas | módulo de remesas CUYANA, separada |
| Pedido del cliente | Supabase CUYANA `store_orders` |
| Estado operativo de entrega | CUYANA |
| Resultado contable y reparto | Cuadre |
| Tarifas de mensajería | matriz oficial de mensajería reutilizada desde Casa Viva/CUYANA |

Nunca mezclar tasa de remesa con tasa comercial de tienda.

---

## 5. Cuyana Market Intelligence

### 5.1 Objetivo

Crear un motor que mantenga actualizados costos, proveedores y precios de referencia sin permitir que una fuente externa cambie precios públicos de forma peligrosa.

### 5.2 Datos por observación

Cada precio encontrado debe almacenar:

- producto normalizado;
- presentación/unidad;
- precio;
- moneda;
- proveedor;
- teléfono/WhatsApp público si existe;
- municipio/ubicación;
- fuente URL o evidencia;
- fecha/hora observada;
- mínimo de compra;
- retail/mayorista;
- delivery disponible;
- confianza de la fuente;
- estado: detectado / revisado / aprobado / descartado;
- variación contra precio anterior.

### 5.3 Fuentes iniciales

- elTOQUE para referencia de mercado informal de CUP/USD, tratada como referencia y no como precio garantizado de transacción;
- Revolico y proveedores públicos;
- tiendas online cubanas y competidores;
- proveedores ingresados manualmente;
- precios reales pagados en operaciones de CUYANA.

### 5.4 Regla de seguridad

La IA puede:

1. buscar;
2. detectar;
3. normalizar;
4. comparar;
5. proponer.

Pero no debe publicar automáticamente un cambio extremo sin validación.

Crear umbrales configurables. Ejemplo:

- variación <=5%: actualizar costo interno automáticamente si la fuente tiene confianza suficiente;
- variación >5% y <=15%: marcar revisión;
- variación >15%: bloquear cambio público y pedir confirmación administrativa.

Los porcentajes son configurables.

### 5.5 Precio manual

Administración debe poder:

- fijar un precio manual;
- fijar margen por producto;
- fijar margen por categoría;
- fijar margen por combo;
- definir margen general;
- definir fecha de expiración del override;
- elegir si una regla automática puede reemplazarlo.

Prioridad de reglas sugerida:

`override manual activo > producto > combo > categoría > regla CUYANA general`.

---

## 6. Catálogo inicial de alimentos

Prioridad de observación y carga:

1. pollo;
2. huevos;
3. arroz;
4. aceite;
5. frijoles;
6. azúcar;
7. pasta/espaguetis;
8. salchichas;
9. picadillo;
10. leche en polvo;
11. café;
12. atún/sardinas;
13. detergente;
14. jabón de baño;
15. jabón de lavar;
16. papel sanitario;
17. pasta dental;
18. champú;
19. productos de limpieza del hogar.

Cada producto puede estar visible aunque la marca cambie. Si no existe inventario asegurado, la ficha pública debe vender cantidad/tipo y expresar la política de sustitución.

---

## 7. Combos iniciales

Los nombres y composiciones son comerciales y pueden ajustarse según costo/stock. Los precios no deben quedar codificados en el frontend; se calculan desde datos vigentes.

### A. Resuelve

Objetivo: compra pequeña semanal.
Rango de venta deseado: aproximadamente G$5,900-G$7,200 más mensajería.

### B. Compra de Mamá

Objetivo: principal oferta media.
Rango deseado: aproximadamente G$9,900-G$11,500 más mensajería.

### C. Casa Completa

Objetivo: alimentación + higiene.
Rango deseado: aproximadamente G$14,500-G$15,900 más mensajería.

### D. Familia Abastecida

Objetivo: compra mayor para el hogar.
Rango deseado: alrededor de G$19,900 más mensajería.

### E. Arma tu combo

No es un combo fijo. Permite:

- añadir/quitar productos;
- cambiar cantidad;
- ver subtotal vivo;
- ver mensajería cuando exista dirección;
- ver total final;
- mantener un presupuesto máximo si el usuario eligió uno.

---

## 8. Herramienta `Dime cuánto quieres gastar`

Entrada principal recomendada para el mercado de Guyana:

- G$5,000
- G$10,000
- G$15,000
- G$20,000
- Otro importe

Flujo:

1. Usuario elige presupuesto.
2. Motor calcula presupuesto neto disponible usando tasa comercial vigente y reglas de margen.
3. Recomienda una combinación de productos.
4. Usuario puede quitar/agregar.
5. Nunca permitir silenciosamente exceder el presupuesto: mostrar diferencia y pedir ajuste.
6. Mensajería se muestra separada del presupuesto de mercancía, salvo que el usuario elija explícitamente `presupuesto total incluida entrega`.

En versiones futuras, optimizar automáticamente por prioridad nutricional, preferencias del destinatario, disponibilidad y relación valor/precio.

---

## 9. Sustituciones y disponibilidad

Como CUYANA no parte de un gran almacén propio:

- no prometer marca fija cuando no esté garantizada;
- mostrar `sujeto a disponibilidad` cuando corresponda;
- permitir al cliente elegir:
  - `Acepto sustituciones equivalentes o superiores`;
  - `Contáctenme antes de sustituir`.

Nunca sustituir una categoría esencial por otra diferente sin autorización.

Registrar la sustitución real en el pedido para aprender qué productos fallan más.

---

## 10. Proveedores

Crear ficha operativa por proveedor:

- nombre;
- contacto;
- ubicación;
- productos;
- precios actuales;
- mínimo de compra;
- forma de pago;
- entrega sí/no;
- rapidez;
- stock observado;
- fecha última comprobación;
- número de operaciones realizadas;
- precio respetado sí/no;
- calidad 1-5;
- disponibilidad histórica;
- incidencias.

El motor no debe buscar solo `más barato`; debe poder recomendar `mejor proveedor` usando costo + disponibilidad + confiabilidad + distancia/logística.

---

## 11. Checkout y flujo operativo

### Cliente

1. Elige combo o arma pedido.
2. Introduce datos mínimos.
3. Dirección del receptor en Cuba.
4. Sistema calcula mensajería.
5. Elige entrega estándar/prioritaria/mismo día.
6. Ve total en GYD.
7. Confirma método de pago disponible en Guyana.
8. CUYANA crea pedido con snapshot completo de precios y reglas utilizadas.

### Operación

Estados mínimos:

`pendiente_pago -> pagado -> compra_pendiente -> comprando -> preparado -> en_entrega -> entregado`

Estados excepcionales:

`requiere_sustitucion`, `sin_stock`, `cancelado`, `reembolsado`, `incidencia`.

No comprar mercancía antes de confirmar el pago durante la fase sin liquidez.

---

## 12. Datos que debe congelar cada pedido

Aunque los precios cambien después, un pedido confirmado debe conservar:

- productos/variantes/cantidades;
- precio observado usado;
- costo estimado;
- tasa comercial usada;
- costo USDT usado;
- margen usado;
- mensajería;
- suplemento de urgencia;
- total GYD;
- reparto esperado 5/5/5;
- fecha/hora;
- proveedor sugerido en ese momento.

Al cerrar la compra se añaden costo real y proveedor real para medir desviación.

---

## 13. Fotografía y presentación

Para los combos:

- fotografía limpia y realista;
- no enseñar marcas que no podamos garantizar salvo que la ficha sea de marca específica;
- preferir composición de alimentos reconocibles;
- crear versión cuadrada para catálogo y vertical para redes si se necesita;
- no poner precios dentro de la imagen para evitar rehacerla cuando cambien;
- el precio siempre debe venir de datos de la plataforma.

Para `Arma tu combo`, cada producto individual necesita imagen consistente y fondo limpio.

---

## 14. Plan de implementación por bloques

### BLOQUE 0 — Fuente de verdad y reglas

- [x] Crear este Blueprint Maestro.
- [ ] Enlazarlo desde HANDOFF/TASKS.
- [ ] Confirmar estructura de datos existente antes de crear tablas nuevas.
- [ ] Documentar regla 15% = 5% Lennys + 5% Adonys + 5% CUYANA.
- [ ] Mantener remesas completamente separadas.

### BLOQUE 1 — Modelo de datos de inteligencia

Implementar/reutilizar entidades para:

- suppliers;
- supplier_products / price_observations;
- market_reference_rates;
- pricing_rules;
- combo_templates;
- combo_items;
- manual_overrides;
- provider_score/history.

No crear tablas duplicadas si Product Studio ya posee equivalentes.

### BLOQUE 2 — Motor de precios

- calcular costo vigente;
- aplicar jerarquía de margen;
- convertir a GYD;
- redondeo comercial configurable;
- alertas por variación;
- manual override;
- vigencia/frescura del precio.

### BLOQUE 3 — Inteligencia automática

- actualizar elTOQUE como referencia;
- buscar precios de productos prioritarios;
- guardar evidencia;
- comparar proveedores;
- detectar variaciones;
- proponer cambios;
- flujo de aprobación.

### BLOQUE 4 — Catálogo y combos

- crear 4 combos iniciales;
- crear fichas de productos individuales;
- fotos;
- disponibilidad y sustitución;
- publicación en CUYANA.

### BLOQUE 5 — Arma tu combo

- selector de productos;
- cantidades;
- presupuesto vivo;
- resumen sticky móvil;
- límites de presupuesto;
- recomendación automática.

### BLOQUE 6 — Mensajería y urgencia

- reutilizar matriz oficial Casa Viva;
- cálculo por municipio/localidad;
- 24-48h estándar;
- <=24h suplemento;
- mismo día premium;
- reglas configurables.

### BLOQUE 7 — Cuadre

- definir contrato específico para pedidos de comercio;
- enviar pedido confirmado;
- registrar costos reales y reparto;
- conciliación previsto vs real.

### BLOQUE 8 — QA y lanzamiento

Probar mínimo:

- móvil 360/390/412px;
- combos;
- arma tu combo;
- cambio de cantidades;
- sustituciones;
- tasa ausente/vencida;
- precio sin fuente reciente;
- delivery Nuevo Vedado y extremo de tarifa;
- 24h y mismo día;
- checkout completo;
- persistencia del pedido;
- WhatsApp;
- snapshot financiero;
- accesibilidad básica;
- cero errores runtime/build.

---

## 15. Definición de `listo para vender`

No considerar Cuyana Market listo solo porque la pantalla exista.

Debe cumplirse:

1. Al menos 4 combos publicados.
2. Cada combo tiene composición entendible y fotografía.
3. Precio se calcula desde una fuente vigente o un override explícito.
4. Margen 15% correctamente aplicado.
5. Mensajería calculada separadamente.
6. Cliente puede elegir sustitución.
7. Pedido se guarda antes de abrir WhatsApp.
8. Pedido tiene código.
9. Operación puede ver qué comprar.
10. Primer pedido puede completarse sin editar la base manualmente.

---

## 16. Trabajo de hoy — orden recomendado

1. Blueprint Maestro — completar y versionar.
2. PDF para Adonys — explicar el negocio sin detalles técnicos innecesarios.
3. Recuperar matriz oficial de mensajería Casa Viva.
4. Crear ficha de los 4 combos iniciales con productos y costos temporales.
5. Crear fotografías comerciales sin precio impreso.
6. Cargar combos en la fuente de catálogo elegida.
7. Mostrar alimentos en CUYANA.
8. Probar un pedido completo desde móvil.
9. Corregir P0.
10. Registrar resultado en HANDOFF/PROJECT_STATUS.

Si no se puede publicar por un bloqueo externo, dejar exactamente documentado: commit, variable/configuración pendiente, prueba faltante y siguiente acción.

---

## 17. Prompt de continuidad para cualquier IA

> Lee primero `docs/CUYANA_MARKET_BLUEPRINT_MAESTRO.md` completo. Después lee `docs/PROJECT_STATUS.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` y `docs/TASKS.md`. Audita el estado real del repositorio y la base antes de cambiar código. No reconstruyas lo que ya existe. Ejecuta el siguiente bloque incompleto del Blueprint, prueba build/lint/typecheck/tests, actualiza la documentación de continuidad y deja cada cambio versionado. Cuyana Market usa un margen comercial inicial del 15% sobre mercancía (5% Lennys, 5% Adonys, 5% CUYANA), con mensajería y urgencia separadas. Las tasas de remesas nunca se usan para el precio de tienda. Product Studio/NEXO es la capa de inteligencia/catálogo; CUYANA es la experiencia de compra y pedidos; Cuadre es la conciliación contable. Si encuentras una decisión no definida, usa la opción reversible que no rompa estos límites y documenta la hipótesis.

---

## 18. Criterio de producto

El activo estratégico no son solamente los combos. Es la combinación de:

`demanda en Guyana + conocimiento de precios en Cuba + proveedores confiables + catálogo configurable + pago anticipado + entrega + aprendizaje de cada pedido`.

Cada pedido debe mejorar el siguiente.