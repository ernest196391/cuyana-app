# AUDITORÍA VISUAL — LIMPIEZA DE TEXTOS Y TIENDA

**Fecha:** 2026-09-15
**Pantalla de referencia:** iPhone SE, 375 × 667. Todo lo que dice «medido»
está medido ahí, no estimado.
**Commits:** `4527435` y `321b719`, sobre `09124d2` del otro chat.

---

## 1. Lo que se quitó

Todo esto se fue porque no ayudaba a decidir nada. El criterio no fue «hay
mucho texto» sino «este texto no cambia lo que la persona va a hacer».

| Dónde | Qué decía | Por qué se fue |
|---|---|---|
| `/enviar-dinero` | «Tasa vigente · actualizada el 12/9, 21:31» | Solo decía que todo iba bien |
| `/enviar-dinero` | «La comisión ya está incluida en la tasa. Nada que sumar después.» | Borrado |
| Tarjetas del catálogo | «Mismo día», «24 h», «Por confirmar» | Quince etiquetas iguales no ayudan a elegir entre un arroz y un aceite |
| Tarjetas del catálogo | «Preparando la ficha», «Confirmando precio» | El botón ya sale apagado diciendo «No disponible» |
| `/tienda` | «Tienda Cuyana» y su lead | Nombraba la sección en vez de ayudar |
| `/tienda` | «Combos de alimentos para compartir en familia.» | Sustituido |

**Una cosa NO se quitó del todo, a propósito.** El aviso de tasa sigue
saliendo cuando la tasa se está quedando vieja. Lo que desapareció es el
cartelito de cuando todo va bien. Aquí se mueve dinero de terceros: quitar el
cartel de «todo bien» es limpieza; quitar el de «ojo, esto lleva un día sin
actualizarse» habría sido esconder un problema. Si lo quieres fuera también,
se quita en una línea.

---

## 2. Lo que se puso

- **«Enviar dinero» centrado**, y nada entre el título y la calculadora.
- **El botón de WhatsApp en dorado de marca y a la mitad de ancho.** Ocupa el
  60 % del ancho de la tarjeta, 45 px de alto. Dos detalles que no se ven pero
  importan: el texto va oscuro y no blanco, porque sobre ese dorado el blanco
  da 2,4:1 de contraste y no se lee (el grafito da 7,2:1); y la etiqueta se
  acortó a «Pedir por WhatsApp», porque la larga se partía en tres líneas
  dentro del botón nuevo.
- **La puerta de la tienda pregunta** «¿Qué quieres enviar a tu familia en
  Cuba?», centrada, y ofrece tres caminos con foto en vez de botones de texto.
- **Precio en GYD grande con el USD pequeño debajo, también en el teléfono.**
  Antes una regla de CSS escondía el USD justo en la pantalla desde la que
  compra casi todo el mundo.
- **Botón de volver**, discreto y arriba, en categoría, ficha y carrito. Es un
  enlace y no `history.back()`: quien llega desde un enlace de WhatsApp no
  tiene «atrás» ninguno, y el botón no haría nada.

---

## 3. Los nombres largos de energía

Vienen en vivo de NEXO con la ficha técnica pegada:

    «EcoFlow DELTA 3 Ultra — Estación de Energía 3072Wh 4000W»
    «BLUETTI AC180 | 1152 Wh · 1800 W»

Ese nombre no se puede cambiar en origen —es de NEXO—, así que `partirNombre`
lo separa al pintarlo: el modelo arriba, la ficha en su propia línea. **No
inventa ni reescribe nada**: elige qué trozo del texto que ya existe va en cada
sitio, y el nombre entero sigue en la ficha del producto. Ocho pruebas contra
nombres reales de NEXO; si NEXO cambia su formato, esas pruebas avisan.

---

## 4. Lo que se pidió y NO se pudo hacer como se pidió

**El tope de dos líneas para el nombre.** En un teléfono de 375 px la columna
del nombre mide **144 px**. Medido a 14, 13,5, 13, 12,5 y 12 px: «Panel solar
monocristalino 450W» no entra en dos líneas a ningún tamaño legible.

Con el tope en dos, lo que se pierde es el «450W» — y ese es justo el nombre
que se dio por bueno en la revisión. Un nombre de tres líneas es mejor que un
nombre que esconde la potencia, así que se dejó en tres.

Lo que sí se arregló, que era el problema de verdad: ya no hay bloques de
cuatro líneas. Con la ficha técnica fuera del nombre, la mayoría ocupa una o
dos líneas y la tercera la usan los pocos que de verdad la necesitan. Las
filas no se descuadran.

---

## 5. Pendiente, y necesita a una persona

- **Electrodomésticos no tiene foto de campaña.** Alimentos y Energía sí. Lo
  único real que hay es la foto de producto de una arrocera sobre fondo claro,
  y es la que se está usando, encajada entera. Funciona, pero canta un poco al
  lado de las otras dos. Hace falta una foto de la categoría.
- **El resto del repaso de la tienda** queda abierto: la ficha de producto por
  dentro, el carrito y el checkout no se tocaron más allá del botón de volver.

---

## 6. Cómo se comprobó

| Prueba | Qué cubre | Resultado |
|---|---|---|
| `vitest` | 146 pruebas, 8 nuevas de `partirNombre` | 146/146 |
| `ver-visual.mjs` | Las pantallas reales a 375 px: textos fuera, centrados, botón de WhatsApp, volver, sin desbordes | 24/24 |
| `tarjetas.mjs` | La rejilla con el CSS compilado y nombres y precios reales | 8/8 |
| `tsc --noEmit` | — | limpio |
| `next build` | — | limpio |

**Lo que `tarjetas.mjs` NO prueba, y conviene saberlo:** este entorno no tiene
salida a Supabase, así que `/tienda/alimentos` sale vacía y la rejilla no se
puede mirar en la página real. Lo que hace la prueba es cargar la hoja de
estilos que sirve el servidor de producción y meterle el marcado exacto que
produce `ProductCard`, con nombres y precios copiados de producción. Eso prueba
el CSS, que es lo que se tocó. Que el servidor le pase los datos bien lo
cubren las pruebas del adaptador.

**Un fallo que los asserts no vieron y la captura sí:** en el primer pase las
pruebas decían «dos líneas, bien» mientras el CSS se comía el «450W» del panel
por su cuenta. Los asserts leían el texto del DOM, no lo que se ve. Ahora hay
una comprobación de que el CSS no recorta nada (`scrollHeight` contra la
altura visible) y otra específica para ese nombre.


---

## 7. El catálogo apagado del 15 de septiembre

Apareció mientras se revisaba esto, y es más grave que cualquier texto de
relleno: **la tienda amaneció con los 19 productos sin poder comprarse.**

**No se borró nada.** Las 15 fichas de alimentos y las 4 de electrodomésticos
seguían enteras en la base, con sus combos. Lo que había pasado es que
`valid_until` venció en todas a la vez — las de alimentos el día 14, las de
electrodomésticos a las 02:55 del 15 — y la compuerta de vigencia hizo su
trabajo: no dejar vender a un precio caducado.

**La causa de fondo no es el código, es un trabajo diario que nadie hacía.**
Un precio vale 24 h. Renovarlo era pulsar «Revalidar ahora» oferta por oferta,
34 veces, todos los días. El diseño daba por hecho que alguien lo haría.

**Lo que se hizo:**

1. **Un botón «Renovar todo el catálogo»** en Abastecimiento, con la cuenta de
   cuántas ofertas están vencidas arriba del todo. Va por tandas porque cada
   oferta abre la web de su proveedor y todas juntas se pasarían del tiempo
   que Vercel da a una función.
2. **Un riego automático diario** a las 06:00 UTC (02:00 en Guyana), antes de
   que abra nadie. Necesita dos variables en Vercel: `CRON_SECRET` y
   `SUPABASE_SERVICE_ROLE_KEY`. Sin ellas responde 503 y lo dice, en vez de
   fallar callada — un cron que contesta «ok» sin hacer nada dejaría la tienda
   apagada otra vez sin que nadie se entere.
3. **La tarjeta vuelve a decir por qué** algo no se puede comprar. Se lo había
   quitado en el apartado 1 de esta auditoría, pensando que afectaba a unos
   pocos productos. Era falso: afectó a todos a la vez, y una rejilla llena de
   botones apagados sin explicación es exactamente lo que parece una web rota.

**Ninguna de las dos rutas inventa precios.** Vuelven a leer la página real de
cada proveedor. La que no se pueda leer queda bloqueada y su producto sale del
escaparate: vale más una tienda con menos cosas que una que promete un precio
que nadie comprobó.

**Lo que este agente NO pudo hacer:** disparar la renovación. Este entorno no
tiene salida a `alawao.com`, `combitos.com`, `revolico.com` ni
`supermarket23.com`. Que el mecanismo funciona está comprobado por otra vía:
hay 50 revisiones guardadas, 49 leídas bien y 48 con el precio extraído, contra
esos cuatro dominios. Desde Vercel, que sí tiene salida, funcionará.
