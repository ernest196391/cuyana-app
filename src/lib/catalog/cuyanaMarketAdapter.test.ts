import { describe, expect, it } from "vitest";
import { mapPublicFoodRow } from "./cuyanaMarketAdapter";

describe("catálogo público CUYANA", () => {
  it("no expone proveedor, URL ni costo fuente", () => {
    const product = mapPublicFoodRow({
      product_id: "p1", slug: "basicos", name: "Básicos", kind: "bundle", category: "alimentos",
      description: "Compra esencial", presentation: "3 productos", composition: ["arroz", "huevos", "aceite"],
      substitution_policy: "Confirmar equivalentes", price_usd: "30.99", available: true, eta_text: "24 h",
      image_url: null, source_checked_at: "2026-09-13T00:00:00Z", valid_until: "2026-09-14T00:00:00Z",
    });
    expect(product.priceUsd).toBe(30.99);
    expect(product.sourceSystem).toBe("cuyana-market");
    expect(JSON.stringify(product)).not.toContain("alawao");
    expect(JSON.stringify(product)).not.toContain("source_url");
  });
});
