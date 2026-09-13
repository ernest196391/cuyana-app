# AUDITORÍA — TIENDA Y ESTADO REAL

**Fecha:** 2026-09-13
**Agente:** Claude Code
**HEAD auditado al empezar:** `f7d728c`
**Contra:** `CUYANA_BLUEPRINT_MAESTRO_V5_1`, cuyo HEAD auditado (`cde6581`) está **55 commits por detrás** de `main`.

Este documento existe porque el Blueprint pide, en su regla 0, comparar el HEAD
auditado con el real y corregir el estado antes de seguir trabajando. Eso es lo
que se hizo. Todo lo que sigue está comprobado contra la base de producción y
contra el código, no contra documentación previa.

---

## 1. Lo que la auditoría encontró en la tienda

### 1.1 🔴 Se vendía a precio vencido — CORREGIDO

`market_public_catalog.valid_until` existe desde que se creó la tabla. El
catálogo que ve el cliente **no lo miraba**: ni la rejilla, ni la ficha, ni el
servidor que vuelve a resolver el precio al guardar el pedido.

La ruta de compra del operador, `/api/admin/supply/purchase`, **sí lo exige**:

```ts
if (!offer.valid_until || new Date(offer.valid_until) <= new Date())
  return 409 "La oferta debe estar aprobada y vigente antes de comprar."
```

Es decir: la tienda podía venderle a un cliente a un precio que Ernesto tenía
después prohibido pagar. La diferencia la come CUYANA o hay que cancelar el
pedido. Las siete filas publicadas vencían al día siguiente de la auditoría y
nada se habría enterado.

Corregido en `src/lib/catalog/vigencia.ts`, aplicado en el adaptador —no en la
pantalla— porque por el adaptador pasan los tres lectores: rejilla, ficha y
checkout. En la pantalla, el checkout se lo saltaría.

### 1.2 🔴 Un combo destacado sin decir qué lleva dentro — CORREGIDO EL SISTEMA, FALTA EL DATO

`combo-carnes-aceite` está publicado y es **uno de los cuatro destacados** de
`/tienda/alimentos`, con:

- `description` = `""`
- `composition` = `null`
- `substitution_policy` = `null`

Su ficha se renderiza con foto, nombre, presentación y precio. Nada más. Es
exactamente lo único que el Blueprint dice que una ficha de combo no puede ser
(§8.4 referencia Combitos, §10.2), y el paso 7 de §7.3 pone la ficha completa
como condición para publicar. No lo comprobaba nadie.

Ahora un combo con la ficha a medias no se puede comprar y lo dice.

**Lo que falta y no puede hacer una IA:** `market_bundle_items` no tiene ni un
componente para ese combo, así que no hay de dónde sacar la composición sin
inventarla. El único dato real es su presentación: «pollo 3 lb + cerdo 2 lb +
aceite 900 ml–1 L». Tiene que completarlo una persona.

### 1.3 🟠 Un combo publicado al que no se podía llegar — CORREGIDO

`combo-kiosko`, 194,29 USD, publicado: no salía en Alimentos por no estar en
los cuatro destacados, y tampoco en «Completa la compra», que filtra los que no
son combo. Solo se llegaba escribiendo la dirección a mano.

La lista de destacados era la única puerta a los combos. Ahora los cuatro van
primero y detrás el resto.

### 1.4 🟠 `market_bundle_items` está a medias — PENDIENTE, DATO

La composición estructurada solo tiene los componentes que además existen como
producto suelto. Comparado con lo que anuncia cada ficha:

| Combo | Componentes en la base | Anuncia |
|---|---|---|
| `combo-basicos-de-casa` | 2 | 3 — falta el aceite |
| `combo-kiosko` | 3 | 12 — faltan 9 |
| `combo-proteina-familiar` | 1 | 2 — falta el pollo |
| `combo-proteina-mixta` | 1 | 3 — faltan pollo y cerdo |
| `combo-carnes-aceite` | **0** | — |

El texto de `composition` es hoy la única descripción real del contenido. Hasta
que `market_bundle_items` esté completo no se puede calcular coste por
componente, ni sustituir una pieza sin tocar el combo entero, ni revalidar
precio pieza a pieza.

### 1.5 🟠 Solo 2 productos sueltos publicados de 30 — PENDIENTE, DATO

`market_products` tiene 30 filas. `market_public_catalog` tiene 7: cinco combos
y **dos** productos (arroz y solomillo). El Blueprint pide ~20–30 publicados.

La causa es de diseño: `market_public_catalog` **se rellena a mano**. No hay
función ni vista que la derive de los productos, así que publicar es copiar
filas y la ficha se queda como se copió. Por ahí entraron 1.2 y 1.3.

### 1.6 🟡 ETAs inconsistentes — PENDIENTE, DATO

Conviven «Entrega express 24 h», «24 h», «Sujeto a confirmación» y «Mismo día
antes de las 12:00; sujeto a destino». La tarjeta reduce el último a «Mismo
día», que promete más de lo que dice el resto de la web (piloto en La Habana,
mensajería según municipio).

### 1.7 🟡 El motor de auditoría nunca ha corrido — PENDIENTE

`market_supplier_audits` = 0 filas. El motor de §7.2 existe en código
(`src/lib/supply/audit.ts`, `/api/admin/supply/revalidate`) pero no ha llegado
a ejecutarse nunca. El Blueprint pide auditoría programada diaria.

---

## 2. Estado real contra el Blueprint

### ✅ Confirmado en producción

- Portada de tres caminos.
- Remesas: calculadora, métodos, vigencia de tasa, pedido, WhatsApp, aviso a Cuadre.
- Cuadre como fuente maestra de la tasa de remesas, con espejo protegido.
- Energía: catálogo real NEXO, ficha, carrito, checkout, destino, mensajería, código, Cuadre.
- Tienda: `store_orders` canónico, precio revalidado en servidor, pedido antes de WhatsApp, Cuadre puede fallar sin perder el pedido.
- **Cuenta de cliente**: registro/login, Mi cuenta, historial, gasto, perfil.
- **Beneficiarios reutilizables**: se guardan y rellenan el checkout sin volver a teclear.
- **Carnet**: bucket privado, subida desde móvil, bitácora de cada apertura escrita ANTES de entregar el enlace, revisión desde `/admin/clientes`.
- **Confianza y crédito**: nivel y límite solo los mueve un administrador; la base lo hace cumplir.
- **Referidos** del cliente verificado, sin porcentaje inventado.
- **Comprobante público** por referencia, sin datos de quien envía.
- Abastecimiento: proveedores, ofertas, observaciones, revalidación pre-compra, panel `/admin/abastecimiento`.

### 🟡 A medias

- **Alimentos**: infraestructura completa, catálogo al 23 % de lo que pide el Blueprint (7 de ~30) y con los defectos de §1.
- **Versionado del esquema**: corregido durante esta sesión —seis migraciones llevaban solo el comentario y no el SQL—, pero conviene un `supabase db dump` de contraste.

### 🔴 El tracking: la mitad

Esta es la respuesta a «creo que tracking todavía no está, no sé».

| | Estado |
|---|---|
| Modelo de saltos (`cuadre.envio_estados`) | ✅ existe, con hora real por salto |
| Pantalla del operador para moverlo | ✅ en Cuadre, bandeja y entrega |
| Vista del cliente | ✅ en Mi cuenta y en el comprobante |
| Enlace de seguimiento para invitado | ✅ `/envio/<ref>`, sin cuenta |
| **Remesas atadas a su referencia** | 🟡 el código ya lo hace; **0 de 4 pedidos** la tienen, son anteriores |
| **Saltos registrados en producción** | 🔴 **0** — nunca ha corrido con datos reales |
| **Tracking de pedidos de tienda** | 🔴 **no existe**: `store_orders` no tiene `tracking_ref` |
| Estados de tienda de §7.3 | 🔴 no existen |
| Incidencias, sustitución, reembolso | 🔴 no existen |

**Conclusión honesta:** el tracking de remesas está construido y probado en
banco, pero no se ha estrenado. El de tienda no existe. El Blueprint (§7) los
pide desde la misma experiencia, y hoy no lo están.

### 🔴 No empezado

- `Arma tu combo` (Fase 6).
- `Dime cuánto quieres gastar` (Fase 7).
- Contexto de destino en `/tienda/alimentos` — es el punto 1 de §8.5 y ya es
  posible porque los beneficiarios existen.
- Market Intelligence como panel (Fase 8).
- IA de compra (§8.6).
- Los benchmarks de §14.1: ninguno hecho. Sin acceso web desde este entorno.

---

## 3. Qué construir después, y por qué en este orden

### Primero — cerrar el tracking, que está a medio camino

Es lo único del MVP de §17 que está empezado y sin terminar, y lo que hace que
todo lo demás valga: un cliente que ve dónde va lo suyo vuelve.

1. `store_orders.tracking_ref` + su primer salto al crear el pedido.
2. Los estados de tienda de §7.3, que no son los de remesa.
3. Una remesa real de punta a punta: pedir → mover los cuatro pasos → verlo en
   Mi cuenta y en el comprobante. Hoy hay **cero** saltos en producción.

### Segundo — completar el catálogo, que es lo que hace falta para vender

4. Completar la ficha de `combo-carnes-aceite` (dato, persona).
5. Completar `market_bundle_items` de los cinco combos.
6. Publicar los ~20 productos que ya están en `market_products`.
7. Unificar los textos de ETA.
8. Sustituir el publicado a mano por una función que solo deje publicar fichas
   completas: es la causa raíz de §1.2 y §1.3, y volverá a pasar.

### Tercero — lo que multiplica

9. Contexto de destino en Alimentos (§8.5 punto 1).
10. `Arma tu combo`.
11. Programar la auditoría diaria de proveedores.

### Pendiente de decisión tuya

- **Confirmación por correo del alta**: hoy encendida y sin servidor de correo.
  Ver README.
- **Cuánto se le da por referido** y **cuánto se adelanta**: los dos en 0,
  esperando número.
- Los cuatro combos del Blueprint (§10) se llaman *Resuelve*, *Compra de Mamá*,
  *Casa Completa* y *Familia Abastecida*. Los publicados son otros cinco con
  otros nombres. Hay que decidir si el Blueprint se corrige o los combos se
  renombran; ahora mismo no coinciden y los dos documentos no pueden tener razón.

---

## 4. Lo que este agente NO hizo, y por qué

- **No completé la ficha de `carnes-aceite`.** No hay composición estructurada
  de dónde sacarla y el Blueprint prohíbe inventar especificaciones.
- **No hice los benchmarks de §14.1.** Este entorno no tiene salida a internet.
  Quedan marcados `⚪ BENCHMARK EXTERNO PENDIENTE`, como manda §0.1.
- **No renombré los combos** para que cuadren con §10: es una decisión
  comercial, no una corrección.
