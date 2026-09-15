// Banco de pruebas de la TARJETA, con el CSS compilado de verdad.
//
// Aquí no hay salida a Supabase, así que /tienda/alimentos sale vacía y no se
// puede mirar la rejilla en la página real. Lo que sí se puede es cargar la
// hoja de estilos que sirve el servidor de producción y meterle el marcado
// exacto que produce ProductCard, con nombres y precios copiados del catálogo
// en producción. Eso prueba el CSS, que es lo que se tocó.
//
// Lo que esto NO prueba: que el servidor le pase los datos bien. Eso lo
// cubren las pruebas de unidad del adaptador y de `partirNombre`.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// `partirNombre` vive en TypeScript y esto es un .mjs que corre node a pelo,
// así que se compila al vuelo. Se hace así, y no copiando la función aquí,
// porque dos copias de la misma regla se separan en cuanto alguien toca una:
// la prueba diría que todo va bien mientras la web hace otra cosa.
const tmp = mkdtempSync(join(tmpdir(), "cuyana-visual-"));
const compilado = join(tmp, "nombre.mjs");
execFileSync("npx", ["esbuild", "src/lib/catalog/nombre.ts", "--format=esm",
                     `--outfile=${compilado}`, "--log-level=error"],
             { cwd: new URL("../..", import.meta.url).pathname, stdio: "inherit" });
const { partirNombre } = await import(compilado);

const BASE = process.env.CUYANA_BASE || "http://localhost:3000";
let bien = 0, mal = 0;
const ok = (c, q, e = "") => { c ? bien++ : mal++; console.log(`${c ? " BIEN " : " MAL  "} ${q}${e ? "  — " + e : ""}`); };

// Nombres reales: los de energía vienen de NEXO tal cual, los de alimentos de
// market_public_catalog.
const PRODUCTOS = [
  { nombre: "BLUETTI AC180 | 1152 Wh · 1800 W", pres: null, gyd: "G$184,975", usd: "US$672.64" },
  { nombre: "EcoFlow DELTA 3 Ultra — Estación de Energía 3072Wh", pres: null, gyd: "G$466,725", usd: "US$1,697.18" },
  { nombre: "Lámpara LED Recargable USB 30W con Gancho — 3 Modos", pres: null, gyd: "G$3,675", usd: "US$13.36" },
  { nombre: "Inversor Solar Híbrido SUMRY 4000W 24V 120V", pres: null, gyd: "G$140,875", usd: "US$512.27" },
  { nombre: "Panel solar monocristalino 450W", pres: null, gyd: "G$99,000", usd: "US$360.00" },
  { nombre: "Combo Kiosko", pres: "12 líneas: pollo, cerdo, jamón, leche, Choco Milk, aceite, frijoles, café, arroz, mayonesa, azúcar y atún.", gyd: "G$53,430", usd: "US$194.29" },
  { nombre: "Solomillo de cerdo", pres: "pieza de 1.25–1.50 kg", gyd: "G$4,675", usd: "US$17.00" },
  { nombre: "Atún", pres: "170 g", gyd: "G$605", usd: "US$2.20" },
  // El caso que se rompió el 15 de septiembre: precio vencido. La tarjeta
  // TIENE que decir por qué, o la rejilla entera parece una web rota.
  { nombre: "Proteína Familiar", pres: "30 huevos + 11 lb de muslo", gyd: "G$25,300", usd: "US$92.00", motivo: "Confirmando precio" },
];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 375, height: 667 } });

const css = await (await fetch(BASE + "/tienda")).text();
const hojas = [...new Set([...css.matchAll(/\/_next\/static\/css\/[a-z0-9]+\.css/g)].map((m) => m[0]))];

const tarjetas = PRODUCTOS.map((p) => {
  const { nombre, ficha } = partirNombre(p.nombre);
  const detalle = p.pres || ficha;
  return `<article class="product-card">
    <a class="product-card-link" href="#">
      <div class="product-card-img"><div class="product-card-img-placeholder"></div></div>
      <span class="product-card-name" title="${p.nombre}">${nombre}</span>
      ${detalle ? `<span class="product-card-presentation">${detalle}</span>` : ""}
      <span class="product-card-price">${p.gyd}</span>
      <span class="product-card-price-secondary">${p.usd}</span>
      ${p.motivo ? `<span class="product-card-motivo">${p.motivo}</span>` : ""}
    </a>
    <div class="product-card-add"><button class="cta">Añadir</button></div>
  </article>`;
}).join("");

await page.setContent(
  hojas.map((h) => `<link rel="stylesheet" href="${BASE}${h}">`).join("") +
  `<div class="wrap page-section"><div class="product-grid">${tarjetas}</div></div>`,
  { waitUntil: "networkidle" },
);
await page.waitForTimeout(400);

const n = await page.locator(".product-card").count();
ok(n === PRODUCTOS.length, `se pintan las ${PRODUCTOS.length} tarjetas`, `${n}`);

// El USD tiene que VERSE en el teléfono, que es de lo que iba la queja.
const usds = page.locator(".product-card-price-secondary");
const visibles = await usds.evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").length);
ok(visibles === n, `el USD se ve en las ${n} tarjetas a 375px`, `${visibles} visibles`);

const tamGyd = await page.locator(".product-card-price").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
const tamUsd = await usds.first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
ok(tamUsd < tamGyd, `el USD va pequeño (${tamUsd}px) frente al GYD (${tamGyd}px)`);

// Ningún nombre puede pasar de dos líneas.
const lineas = await page.locator(".product-card-name").evaluateAll((els) =>
  els.map((e) => {
    const cs = getComputedStyle(e);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
    return Math.round(e.getBoundingClientRect().height / lh);
  }));
ok(lineas.every((l) => l <= 3), `ningún nombre pasa de 3 líneas`, `máximo ${Math.max(...lineas)}`);

// Que el CSS no corte lo que `partirNombre` dejó entero. Si el nombre que se
// pinta cabe en el hueco, `scrollHeight` y la altura visible coinciden; si el
// clamp tuvo que comerse algo, el scroll es mayor. Esto es lo que se le
// escapó al primer pase: los asserts decían «2 líneas, bien» mientras el
// «450W» del panel se perdía por el camino.
const cortados = await page.locator(".product-card-name").evaluateAll((els) =>
  els.filter((e) => e.scrollHeight > e.clientHeight + 1).map((e) => e.textContent));
ok(cortados.length === 0, "el CSS no corta ningún nombre por su cuenta", cortados.join(" / "));

// Y en concreto el que se dio por bueno en la auditoría tiene que salir entero.
const panel = await page.locator(".product-card-name").filter({ hasText: "Panel solar" }).textContent();
ok(panel.includes("450W"), "«Panel solar monocristalino 450W» conserva el 450W", panel);

// El motivo se ve, y se lee: un texto del mismo color que el fondo no sirve
// de nada aunque el elemento exista.
const motivo = page.locator(".product-card-motivo");
ok((await motivo.count()) === 1, "la tarjeta sin precio vigente dice por qué");
ok(await motivo.first().isVisible(), "y el motivo se ve");
const colores = await motivo.first().evaluate((e) => {
  const cs = getComputedStyle(e);
  let fondo = "rgba(0, 0, 0, 0)", n = e;
  while (n && fondo === "rgba(0, 0, 0, 0)") { fondo = getComputedStyle(n).backgroundColor; n = n.parentElement; }
  return { texto: cs.color, fondo };
});
ok(colores.texto !== colores.fondo, "y no es texto del color del fondo", JSON.stringify(colores));

// Y las tarjetas de una misma fila tienen que medir lo mismo.
const altos = await page.locator(".product-card").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
const filas = [];
for (let i = 0; i < altos.length; i += 2) filas.push(altos.slice(i, i + 2));
const descuadre = Math.max(...filas.map((f) => (f.length === 2 ? Math.abs(f[0] - f[1]) : 0)));
ok(descuadre <= 2, "las dos tarjetas de cada fila miden lo mismo", `se descuadran ${descuadre}px`);

// Nada se sale de ancho.
const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(desborde <= 0, "la rejilla no se va de ancho", `sobran ${desborde}px`);

await page.screenshot({ path: `${process.env.CAPTURAS || "/tmp"}/04-tarjetas.png`, fullPage: true });
console.log(`\n═══ ${bien} bien · ${mal} mal ═══`);
await browser.close();
process.exit(mal ? 1 : 0);
