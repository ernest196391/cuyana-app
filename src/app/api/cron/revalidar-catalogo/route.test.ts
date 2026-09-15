import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * El cierre de la ruta que riega el catálogo.
 *
 * Esto escribe precios de venta en producción sin que haya una persona
 * delante, así que lo único que puede dispararlo es Vercel con su secreto.
 * Las dos formas de equivocarse aquí son caras:
 *
 *  · Dejarla abierta: cualquiera en internet podría hacer que la tienda
 *    saliera a pedirle 34 páginas a cuatro proveedores, todas las veces que
 *    quisiera.
 *  · Dejarla fallando callada si falta una variable en el servidor. El
 *    catálogo se apagaría igual que el 15 de septiembre y nadie sabría por
 *    qué, porque el cron habría respondido «ok».
 *
 * Las variables se leen al importar el módulo, así que cada prueba resetea
 * módulos y vuelve a importar con el entorno que quiere probar.
 */
const ENTORNO = { ...process.env };

afterEach(() => {
  process.env = { ...ENTORNO };
  vi.resetModules();
});

async function cargarRuta() {
  vi.resetModules();
  return import("./route");
}

const pedir = (auth?: string) =>
  new Request("https://cuyana.test/api/cron/revalidar-catalogo", {
    headers: auth ? { authorization: auth } : {},
  });

describe("el riego diario del catálogo", () => {
  it("se niega a correr si falta el secreto del cron", async () => {
    process.env.CRON_SECRET = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-servicio";
    const { GET } = await cargarRuta();
    const r = await GET(pedir("Bearer loquesea"));
    expect(r.status).toBe(503);
    // Y lo dice, no se calla: un cron que responde «ok» sin hacer nada deja
    // la tienda apagada sin que nadie se entere.
    expect((await r.json()).error).toMatch(/CRON_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("se niega a correr si falta la llave de servicio", async () => {
    process.env.CRON_SECRET = "secreto";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    const { GET } = await cargarRuta();
    expect((await GET(pedir("Bearer secreto"))).status).toBe(503);
  });

  it("rechaza a quien llega sin cabecera", async () => {
    process.env.CRON_SECRET = "secreto";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-servicio";
    const { GET } = await cargarRuta();
    expect((await GET(pedir())).status).toBe(401);
  });

  it("rechaza un secreto equivocado", async () => {
    process.env.CRON_SECRET = "secreto";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-servicio";
    const { GET } = await cargarRuta();
    expect((await GET(pedir("Bearer otro-secreto"))).status).toBe(401);
  });

  it("no acepta el secreto sin el «Bearer» delante", async () => {
    process.env.CRON_SECRET = "secreto";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-servicio";
    const { GET } = await cargarRuta();
    expect((await GET(pedir("secreto"))).status).toBe(401);
  });

  it("no deja pasar un secreto que solo empieza igual", async () => {
    // Por si alguna vez alguien cambia la comparación por un `startsWith`.
    process.env.CRON_SECRET = "secreto";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-servicio";
    const { GET } = await cargarRuta();
    expect((await GET(pedir("Bearer secreto-y-algo-mas"))).status).toBe(401);
  });
});
