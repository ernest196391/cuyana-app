# Pruebas visuales de la tienda

Dos guiones que miran la web con un navegador de verdad, a 375 × 667, que es
el tamaño desde el que compra casi todo el mundo.

## Cómo se corren

```bash
npm run build
npx next start -p 3340          # en otra terminal
CUYANA_BASE=http://localhost:3340 node scripts/visual/ver-visual.mjs
CUYANA_BASE=http://localhost:3340 node scripts/visual/tarjetas.mjs
```

Hace falta `playwright` instalado. Si el navegador no aparece, pásale la ruta:
el entorno remoto trae uno en `/opt/pw-browsers/chromium`.

**Levanta el servidor DESPUÉS de compilar, y mata el anterior.** Un `next
start` viejo sirve hashes de CSS que el build nuevo ya borró, y entonces la
página carga sin estilos y las pruebas fallan por todos lados sin que haya
nada roto. Pasó, y cuesta un rato darse cuenta.

## Qué mira cada uno

**`ver-visual.mjs`** — las pantallas reales: que los textos de relleno no
estén, que el título vaya centrado, el botón de WhatsApp (ancho, alto, color),
que el volver lleve a donde dice, y que nada se salga de ancho.

**`tarjetas.mjs`** — la rejilla del catálogo. Carga la hoja de estilos que
sirve el servidor y le mete el marcado exacto de `ProductCard` con nombres y
precios copiados de producción.

Se hace así porque el entorno de trabajo no tiene salida a Supabase y
`/tienda/alimentos` sale vacía. **Prueba el CSS, no los datos**: que el
servidor le pase bien los productos lo cubren las pruebas del adaptador.

Vigila en concreto dos cosas que un assert ingenuo no ve:

- Que el CSS no recorte por su cuenta un nombre que `partirNombre` dejó
  entero (`scrollHeight` contra la altura visible). Leer `textContent` no
  vale: el texto sigue en el DOM aunque el clamp lo tape.
- Que «Panel solar monocristalino 450W» conserve el «450W». Ese nombre es el
  caso límite de la columna de 144 px y es el que se rompe primero si alguien
  vuelve a apretar el tamaño de letra o el número de líneas.

## Variables

| Variable | Para qué | Por defecto |
|---|---|---|
| `CUYANA_BASE` | Dónde está el servidor | `http://localhost:3000` |
| `CHROMIUM` | Ruta al navegador, si Playwright no lo encuentra | el suyo |
| `CAPTURAS` | Dónde dejar los pantallazos | `/tmp` |

`tarjetas.mjs` se compila `src/lib/catalog/nombre.ts` al vuelo con esbuild. No
lleva una copia de `partirNombre` a propósito: dos copias de la misma regla se
separan en cuanto alguien toca una, y la prueba diría que todo va bien
mientras la web hace otra cosa.
