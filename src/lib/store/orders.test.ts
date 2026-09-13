import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lo que guarda esta prueba es la regla que tuvo la tienda parada: sobre
 * `store_orders` el cliente puede INSERTAR pero NO LEER —ahí están los nombres
 * y teléfonos de todos los demás—, así que encadenar un `.select()` al insert
 * hace que todos los pedidos fallen aunque la fila se haya guardado.
 */

const producto = {
  slug: "infinity-solar-moonflyer-pro",
  sourceSystem: "nexo",
  sourceProductId: "42",
  name: "Infinity Solar MoonFlyer Pro",
  priceUsd: 4215,
  category: "energia" as const,
  available: true,
};

/** Lo que la tabla deja hacer de verdad, según sus políticas en producción. */
let selectEstaPermitido = false;
let insertsHechos: Array<Record<string, unknown>> = [];

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      insert: (fila: Record<string, unknown>) => {
        insertsHechos.push(fila);
        const resultadoDelInsert = { data: null, error: null };
        return {
          // RLS permite el INSERT…
          then: (r: (v: typeof resultadoDelInsert) => unknown) => r(resultadoDelInsert),
          // …pero leer de vuelta lo deniega, como en producción.
          select: () => ({
            single: async () =>
              selectEstaPermitido
                ? { data: { id: "x", code: fila.code }, error: null }
                : {
                    data: null,
                    error: { code: "42501", message: "new row violates row-level security policy" },
                  },
          }),
        };
      },
    }),
  },
}));

const proveedor = {
  sourceSystem: "nexo",
  configured: true,
  getProduct: async () => ({ status: "ok" as const, product: producto }),
  getCommercialRate: async () => ({ gydPerUsd: 300, asOf: "2026-09-12T00:00:00Z", source: "manual" }),
  listByCategory: async () => ({ status: "ok" as const, products: [producto] }),
  createOrder: async () => ({ status: "error" as const, message: "no usado" }),
};

const entrada = {
  idempotencyKey: "k",
  items: [{ slug: producto.slug, sourceSystem: "nexo", sourceProductId: "42", quantity: 3 }],
  customerName: "Ernesto Rondón",
  customerWhatsapp: "+5354056173",
};

beforeEach(() => {
  vi.resetModules();
  insertsHechos = [];
  selectEstaPermitido = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("pedido de tienda", () => {
  it("se registra aunque leer la fila esté prohibido", async () => {
    const { createStoreOrder } = await import("./orders");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await createStoreOrder(proveedor as any, entrada);
    expect(r.status).toBe("ok");
  });

  it("devuelve el código y el id que él mismo decidió", async () => {
    const { createStoreOrder } = await import("./orders");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await createStoreOrder(proveedor as any, entrada);
    if (r.status !== "ok") throw new Error("debería haber ido bien");
    expect(r.orderCode).toMatch(/^CUY-ENE-[0-9A-F]{8}$/);
    // El id no se inventa después: es el que se guardó en la fila.
    expect(insertsHechos[0].id).toBe(r.canonicalOrderId);
    expect(insertsHechos[0].code).toBe(r.orderCode);
  });

  it("el total sale del catálogo, no de lo que mande el navegador", async () => {
    const { createStoreOrder } = await import("./orders");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createStoreOrder(proveedor as any, entrada);
    expect(insertsHechos[0].total_usd).toBe(12645); // 3 × 4.215
  });

  it("entra sin dueño cuando el pedido no lleva cuenta", async () => {
    const { createStoreOrder } = await import("./orders");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createStoreOrder(proveedor as any, entrada);
    // Nulo y escrito, no ausente: así se ve que este lo hizo alguien sin
    // registrarse, que tiene que seguir siendo posible.
    expect(insertsHechos[0].customer_id).toBeNull();
  });

  it("guarda de quién es cuando el pedido viene con cuenta", async () => {
    const { createStoreOrder } = await import("./orders");
    const quien = "8f14e45f-ceea-4e7c-9c2f-8c3a12345678";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createStoreOrder(proveedor as any, { ...entrada, customerId: quien });
    // Sin esto, quien acaba de comprar con su cuenta abre «Mi cuenta» y no ve
    // su pedido: está en la base, pero sin dueño, y no hay cómo dárselo.
    expect(insertsHechos[0].customer_id).toBe(quien);
  });

  it("un precio vencido no se puede vender, aunque esté en el carrito", async () => {
    const { createStoreOrder } = await import("./orders");
    const { aplicarVigencia } = await import("@/lib/catalog/vigencia");
    // El proveedor devuelve lo mismo que devolvería el catálogo real tras
    // pasar por la vigencia: el precio de ayer, ya caducado.
    const vencido = {
      ...proveedor,
      getProduct: async () => ({
        status: "ok" as const,
        product: aplicarVigencia(
          { ...producto, kind: "product" as const, syncedAt: "2026-09-12T00:00:00Z",
            description: "Panel solar", imageUrl: null },
          "2020-01-01T00:00:00Z",
        ),
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await createStoreOrder(vencido as any, entrada);
    // Esto es lo que cierra el agujero: la ruta de compra del operador ya se
    // negaba a comprar con una oferta vencida. Si la tienda hubiera seguido
    // vendiendo, la diferencia la pagaba CUYANA.
    expect(r.status).toBe("error");
    expect(insertsHechos).toHaveLength(0);
  });

  it("no encadena un select al insert: eso es lo que rompía la tienda", async () => {
    const { createStoreOrder } = await import("./orders");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await createStoreOrder(proveedor as any, entrada);
    // Si alguien vuelve a poner `.select().single()`, con la lectura denegada
    // esto deja de ser "ok" y la prueba lo caza antes de llegar a producción.
    expect(r.status).toBe("ok");
    expect(insertsHechos).toHaveLength(1);
  });
});
