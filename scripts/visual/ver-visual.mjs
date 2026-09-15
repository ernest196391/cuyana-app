import { chromium } from "playwright";
const BASE = process.env.CUYANA_BASE || "http://localhost:3000";
const OUT = process.env.CAPTURAS || "/tmp";
let bien = 0, mal = 0;
const ok = (c, q, e = "") => { c ? bien++ : mal++; console.log(`${c ? " BIEN " : " MAL  "} ${q}${e ? "  — " + e : ""}`); };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
const errores = [];
// En este entorno no hay salida a supabase.co, así que el navegador escupe
// ERR_TUNNEL_CONNECTION_FAILED por cada lectura del catálogo. Eso es el
// sandbox, no la web: se filtra para que no tape un error de verdad.
const DEL_SANDBOX = /ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|supabase\.co|Failed to load resource|Failed to fetch RSC payload/;
page.on("console", (m) => m.type() === "error" && !DEL_SANDBOX.test(m.text()) && errores.push(m.text()));

// ── /enviar-dinero ──────────────────────────────────────────────────────────
await page.goto(BASE + "/enviar-dinero", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const ed = await page.locator("body").innerText();
ok(!/Tasa vigente/.test(ed), "no sale «Tasa vigente» con la tasa al día");
ok(!/comisión ya está incluida/i.test(ed), "no sale lo de la comisión incluida");
const h1 = page.locator("h1.page-title");
ok((await h1.evaluate((e) => getComputedStyle(e).textAlign)) === "center", "«Enviar dinero» va centrado");

const wa = page.locator("#waBtn");
if (await wa.count()) {
  const caja = await wa.boundingBox();
  const cajaWrap = await page.locator(".enviar-dinero-calc").boundingBox();
  const proporcion = caja.width / cajaWrap.width;
  ok(proporcion > 0.35 && proporcion < 0.72, `el botón de WhatsApp ocupa la mitad (${Math.round(proporcion * 100)}%)`);
  ok(caja.height >= 44, `y el dedo lo alcanza: ${Math.round(caja.height)}px de alto`);
  const fondo = await wa.evaluate((e) => getComputedStyle(e).backgroundColor);
  ok(fondo === "rgb(212, 160, 23)", "y está en el dorado de Guyana", fondo);
  const alto = await wa.evaluate((e) => e.getBoundingClientRect().height);
  ok(alto < 70, "en una sola línea, no partido en tres", `${Math.round(alto)}px`);
}
await page.screenshot({ path: OUT + "/01-enviar-dinero.png", fullPage: true });

// ── /tienda ─────────────────────────────────────────────────────────────────
await page.goto(BASE + "/tienda", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const t = await page.locator("body").innerText();
ok(/¿Qué quieres enviar a tu familia en Cuba\?/.test(t), "la puerta hace la pregunta");
ok(!/Tienda Cuyana/.test(t), "y ya no se llama «Tienda Cuyana»");
ok(!/Combos de alimentos/.test(t), "fuera «Combos de alimentos»");
// Contado contra las tarjetas que haya, no contra un número fijo: la tienda
// pasó de dos categorías a tres en una tarde, y un «=== 2» convierte eso en
// un fallo falso.
const caminos = await page.locator(".puerta-card").count();
const conFoto = await page.locator(".puerta-card img").count();
ok(caminos >= 2 && conFoto === caminos, `las ${caminos} tarjetas de la puerta llevan foto`, `${conFoto} con foto`);
ok(/Electrodomésticos/.test(t), "y la categoría nueva está entre ellas");
const th1 = page.locator("h1.page-title");
ok((await th1.evaluate((e) => getComputedStyle(e).textAlign)) === "center", "la pregunta va centrada");
await page.screenshot({ path: OUT + "/02-tienda.png", fullPage: true });

// ── /tienda/alimentos ───────────────────────────────────────────────────────
await page.goto(BASE + "/tienda/alimentos", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const a = await page.locator("body").innerText();
ok(!/Mismo día/.test(a), "fuera los «Mismo día» de las tarjetas");
ok(!/Por confirmar/.test(a), "fuera los «Por confirmar»");
// OJO: «Confirmando precio» y «Preparando la ficha» SÍ tienen que salir
// cuando un producto no se puede comprar. Aquí había dos comprobaciones que
// exigían lo contrario; se quitaron el 15 de septiembre, el día que venció la
// vigencia de las 19 fichas a la vez y la tienda se quedó llena de botones
// apagados sin una palabra de explicación. Una tarjeta que no se puede
// comprar y no dice por qué parece una web rota. Lo que no puede volver es la
// pastilla amarilla: el motivo va como una línea discreta, y que se vea y se
// lea lo comprueba `tarjetas.mjs`.
ok((await page.locator(".volver").count()) === 1, "hay botón de volver");

const tarjetas = page.locator(".product-card");
const cuantas = await tarjetas.count();
console.log(`  (sin salida a Supabase: ${cuantas} productos. La rejilla se prueba en tarjetas.mjs)`);
if (false) {
  const usd = page.locator(".product-card-price-secondary");
  ok((await usd.count()) === cuantas, "cada tarjeta enseña el USD además del GYD", `${await usd.count()} de ${cuantas}`);
  const visible = await usd.first().isVisible();
  ok(visible, "y el USD se VE en el teléfono, no está escondido por CSS");
  const tamGyd = await page.locator(".product-card-price").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const tamUsd = await usd.first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  ok(tamUsd < tamGyd, `el USD va pequeño (${tamUsd}px) y el GYD grande (${tamGyd}px)`);

  // Ningún nombre puede pasar de dos líneas.
  const alturas = await page.locator(".product-card-name").evaluateAll((els) =>
    els.map((e) => {
      const cs = getComputedStyle(e);
      return Math.round(e.getBoundingClientRect().height / (parseFloat(cs.lineHeight) || 19));
    }));
  ok(alturas.every((l) => l <= 2), `ningún nombre pasa de 2 líneas (máx ${Math.max(...alturas)})`);
}
await page.screenshot({ path: OUT + "/03-alimentos.png", fullPage: true });

// ── El volver funciona de verdad ────────────────────────────────────────────
// `waitForURL` y no `waitForLoadState`: aquí las peticiones a Supabase se
// quedan colgadas y «networkidle» resolvía ANTES de que la navegación
// terminara, así que la prueba leía la URL vieja y fallaba sin motivo.
await Promise.all([page.waitForURL("**/tienda", { timeout: 15000 }), page.locator(".volver").click()]);
ok(page.url().endsWith("/tienda"), "el botón de volver lleva a la tienda", page.url());

// ── Sin desbordes laterales en ninguna ──────────────────────────────────────
for (const ruta of ["/enviar-dinero", "/tienda", "/tienda/alimentos", "/carrito"]) {
  await page.goto(BASE + ruta, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(desborde <= 0, `${ruta} no se va de ancho`, `sobran ${desborde}px`);
}

ok(errores.length === 0, "sin errores de consola", errores.slice(0, 3).join(" | "));
console.log(`\n═══ ${bien} bien · ${mal} mal ═══`);
await browser.close();
process.exit(mal ? 1 : 0);
