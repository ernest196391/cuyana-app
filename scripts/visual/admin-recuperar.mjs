// Recuperar el acceso al panel, en pantalla de teléfono.
import { chromium } from "playwright";
const BASE = process.env.CUYANA_BASE || "http://localhost:3366";
let bien = 0, mal = 0;
const ok = (c, q, e = "") => { c ? bien++ : mal++; console.log(`${c ? " BIEN " : " MAL  "} ${q}${e ? "  — " + e : ""}`); };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 375, height: 667 } });

// ── El camino desde «no me acuerdo» ────────────────────────────────────────
await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const olvido = page.getByRole("link", { name: /Olvidaste la contraseña/i });
ok(await olvido.count() > 0, "la pantalla de entrada ofrece «¿Olvidaste la contraseña?»");

await Promise.all([page.waitForURL("**/admin/recuperar", { timeout: 15000 }), olvido.click()]);
ok(page.url().endsWith("/admin/recuperar"), "y lleva a la pantalla de recuperar", page.url());

const campo = page.locator("#email");
ok(await campo.count() === 1, "que pide el correo");
ok((await campo.getAttribute("type")) === "email", "como correo, para que el móvil saque el teclado bueno");

// Vuelta atrás.
await Promise.all([page.waitForURL("**/admin/login", { timeout: 15000 }),
                   page.getByRole("link", { name: /^Volver$/ }).click()]);
ok(page.url().endsWith("/admin/login"), "y se puede volver");

// ── Un enlace caducado no deja a nadie mirando una pantalla en blanco ──────
await page.goto(BASE + "/admin/nueva-clave", { waitUntil: "networkidle" });
await page.waitForTimeout(4000); // margen de espera del canje + el suyo
const texto = await page.locator("body").innerText();
ok(/ya no vale|caduc/i.test(texto), "sin enlace válido, lo dice en vez de quedarse cargando", texto.slice(0, 80));
ok((await page.getByRole("link", { name: /Pedir otro enlace/i }).count()) > 0, "y ofrece pedir otro");

// ── Nada se sale de ancho ──────────────────────────────────────────────────
for (const r of ["/admin/login", "/admin/recuperar", "/admin/nueva-clave"]) {
  await page.goto(BASE + r, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(sobra <= 0, `${r} no se va de ancho`, `sobran ${sobra}px`);
}

await page.goto(BASE + "/admin/recuperar", { waitUntil: "networkidle" });
await page.screenshot({ path: `${process.env.CAPTURAS || "/tmp"}/05-recuperar.png`, fullPage: true });
console.log(`\n═══ ${bien} bien · ${mal} mal ═══`);
await browser.close();
process.exit(mal ? 1 : 0);
