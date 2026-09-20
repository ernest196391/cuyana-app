import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.CUYANA_BASE || "http://localhost:3000";
const OUT = process.env.CAPTURAS || "/tmp";
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errores = [];
page.on("console", (message) => message.type() === "error" && errores.push(message.text()));

await page.goto(`${BASE}/tienda/electrodomesticos`, { waitUntil: "networkidle" });
const tarjetas = page.locator(".product-card");
if ((await tarjetas.count()) < 5) throw new Error("No aparecen los cinco productos nuevos.");
for (const nombre of ["EKO401M-01", "2 toneladas", "F38", "800 W", "YJ-2219"]) {
  if (!(await page.getByText(nombre, { exact: false }).count())) throw new Error(`Falta ${nombre} en el catálogo.`);
}
if ((await page.locator(".product-card img").count()) < 5) throw new Error("Hay imágenes de producto ausentes.");
await page.screenshot({ path: `${OUT}/cuyana-electrodomesticos-390.png`, fullPage: true });

await page.goto(`${BASE}/producto/cafetera-eko-eko401m-01`, { waitUntil: "networkidle" });
const ficha = await page.locator("body").innerText();
for (const texto of ["G$9,625", "US$35.00", "Santiago de Cuba", "6 tazas", "550 W"]) {
  if (!ficha.includes(texto)) throw new Error(`La ficha no muestra ${texto}.`);
}
const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
const schema = JSON.parse(jsonLd);
if (schema["@type"] !== "Product" || schema.offers.price !== "35.00") throw new Error("JSON-LD incompleto.");
await page.getByRole("button", { name: "Añadir al carrito" }).first().click();
await page.goto(`${BASE}/carrito`, { waitUntil: "networkidle" });
const carrito = await page.locator("body").innerText();
if (!carrito.includes("Este pedido se entrega en Santiago de Cuba")) throw new Error("El carrito no conserva Santiago de Cuba.");
if (await page.locator('select#dest-municipio').count()) throw new Error("Santiago no debe usar el tarifario de La Habana.");
if (!(await page.locator('input#dest-municipio').count())) throw new Error("Falta el municipio libre para Santiago.");
await page.screenshot({ path: `${OUT}/cuyana-carrito-santiago-390.png`, fullPage: true });

await page.goto(`${BASE}/sitemap.xml`, { waitUntil: "networkidle" });
if (!(await page.locator("body").innerText()).includes("cafetera-eko-eko401m-01")) throw new Error("El producto no está en sitemap.xml.");
if (errores.length) throw new Error(`Errores de consola: ${errores.slice(0, 3).join(" | ")}`);

console.log("BIEN catálogo, cinco imágenes, ficha, precios, JSON-LD, carrito Santiago y sitemap.");
await browser.close();
