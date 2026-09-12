import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lo que se prueba aquí es lo que no se ve mirando la pantalla: que la clave de
 * Cuadre nunca sale hacia el navegador, que el dinero se recalcula contra la
 * base en vez de creerle al cliente, y que un Cuadre caído no le rompe el
 * pedido a nadie.
 */

const metodo = {
  key: "cup_transferencia",
  label: "CUP por transferencia",
  target_currency: "CUP",
  rate_per_gyd: 3.2,
};

/** Método que devuelve la base. `null` simula un método que no existe. */
let metodoEnBase: typeof metodo | null = metodo;

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: metodoEnBase }) }),
        }),
      }),
    }),
  },
}));

const REF = "3f7c1a9e-0b2d-4c6e-8a1f-9d5b4e2c7a10";

function pedido(extra: Record<string, unknown> = {}) {
  return {
    ref: REF,
    gyd: 10000,
    method_key: "cup_transferencia",
    customer_name: "Yanet Pérez",
    customer_whatsapp: "+53 5 234 5678",
    ...extra,
  };
}

function peticion(cuerpo: unknown, origen = "https://cuyana.casavivadecuba.com") {
  return new Request("https://cuyana.casavivadecuba.com/api/cuadre", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: origen },
    body: JSON.stringify(cuerpo),
  });
}

async function llamar(cuerpo: unknown, origen?: string) {
  const { POST } = await import("./route");
  return POST(peticion(cuerpo, origen));
}

let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  metodoEnBase = metodo;
  process.env.CUADRE_API_KEY = "cuadre_LA_CLAVE_SECRETA";
  process.env.CUADRE_URL = "https://cuadre.example.test";
  fetchFalso = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 201 }));
  vi.stubGlobal("fetch", fetchFalso);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("avisar a Cuadre", () => {
  it("manda el pedido con la clave en la cabecera, nunca en el cuerpo", async () => {
    const res = await llamar(pedido());

    expect(res.status).toBe(204);
    expect(fetchFalso).toHaveBeenCalledOnce();

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://cuadre.example.test/api/pedidos");
    expect((opciones.headers as Record<string, string>).Authorization).toBe(
      "Bearer cuadre_LA_CLAVE_SECRETA"
    );
    // La clave no puede aparecer en lo que se manda como datos.
    expect(String(opciones.body)).not.toContain("cuadre_LA_CLAVE_SECRETA");
  });

  it("la respuesta al navegador va vacía: nada de la clave ni de Cuadre", async () => {
    const res = await llamar(pedido());
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("recalcula el monto con la tasa de la base, no con la que mande el cliente", async () => {
    // El cliente miente: dice que le corresponden 999.999 CUP a tasa 99.
    await llamar(pedido({ amount_destination: 999999, rate_used: 99 }));

    const cuerpo = JSON.parse(String((fetchFalso.mock.calls[0] as [string, RequestInit])[1].body));
    expect(cuerpo.amount_destination).toBe(32000); // 10.000 × 3,2
    expect(cuerpo.rate_used).toBe(3.2);
    expect(cuerpo.currency_destination).toBe("CUP");
  });

  it("usa la identidad del pedido como external_ref, para que no se duplique", async () => {
    await llamar(pedido());
    const cuerpo = JSON.parse(String((fetchFalso.mock.calls[0] as [string, RequestInit])[1].body));
    expect(cuerpo.external_ref).toBe(REF);
  });

  it("rechaza un método que no existe o está inactivo", async () => {
    metodoEnBase = null;
    const res = await llamar(pedido({ method_key: "inventado" }));
    expect(res.status).toBe(400);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it.each([
    ["sin identidad", { ref: "no-es-un-uuid" }],
    ["sin monto", { gyd: 0 }],
    ["monto negativo", { gyd: -5000 }],
    ["sin nombre", { customer_name: "  " }],
    ["sin teléfono", { customer_whatsapp: "" }],
  ])("rechaza un pedido %s", async (_caso, roto) => {
    const res = await llamar(pedido(roto));
    expect(res.status).toBe(400);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("sin clave configurada no avisa, pero tampoco falla", async () => {
    delete process.env.CUADRE_API_KEY;
    const res = await llamar(pedido());
    expect(res.status).toBe(204);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("si Cuadre está caído, el pedido del cliente no se ve afectado", async () => {
    fetchFalso.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = await llamar(pedido());
    expect(res.status).toBe(204);
  });

  it("si Cuadre responde con error, tampoco se le traslada al cliente", async () => {
    fetchFalso.mockResolvedValueOnce(new Response("Clave no válida.", { status: 401 }));
    const res = await llamar(pedido());
    expect(res.status).toBe(204);
  });

  it("corta las llamadas desde otro sitio", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await llamar(pedido(), "https://sitio-cualquiera.example");
    expect(res.status).toBe(403);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
