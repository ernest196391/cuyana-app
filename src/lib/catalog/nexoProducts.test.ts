import { describe, expect, it } from "vitest";
import { isAvailable, mapWooProductToCatalogProduct, resolveNexoImageUrl } from "./nexoProducts";

const BASE_URL = "https://nexotienda.casavivadecuba.com/api/marketplace/products";

describe("resolveNexoImageUrl", () => {
  it("deja intactas las URLs absolutas", () => {
    expect(resolveNexoImageUrl("https://casavivadecuba.com/wp-content/uploads/x.webp", BASE_URL)).toBe(
      "https://casavivadecuba.com/wp-content/uploads/x.webp",
    );
  });
  it("resuelve rutas relativas contra el origin de NEXO", () => {
    expect(resolveNexoImageUrl("/catalog/owner/boviet-620w.webp", BASE_URL)).toBe(
      "https://nexotienda.casavivadecuba.com/catalog/owner/boviet-620w.webp",
    );
  });
  it("sin imagen, devuelve null en vez de una cadena vacía", () => {
    expect(resolveNexoImageUrl(undefined, BASE_URL)).toBeNull();
  });
});

describe("isAvailable", () => {
  it("disponible: en stock, comprable y con precio", () => {
    expect(isAvailable({ id: 1, slug: "x", name: "X", stock_status: "instock", price: "10.00" })).toBe(true);
  });
  it("sigue disponible aunque cambie el stock automático", () => {
    expect(isAvailable({ id: 1, slug: "x", name: "X", stock_status: "outofstock", price: "10.00" })).toBe(true);
  });
  it("no disponible sin precio", () => {
    expect(isAvailable({ id: 1, slug: "x", name: "X", stock_status: "instock", price: "0" })).toBe(false);
  });
  it("sigue publicado hasta que el administrador lo retire de NEXO", () => {
    expect(
      isAvailable({ id: 1, slug: "x", name: "X", stock_status: "instock", price: "10.00", purchasable: false }),
    ).toBe(true);
  });
});

describe("mapWooProductToCatalogProduct", () => {
  it("mapea los campos base y limpia HTML de la descripción", () => {
    const product = mapWooProductToCatalogProduct(
      {
        id: 42,
        slug: "panel-boviet-620w",
        name: "Panel solar Boviet 620W",
        price: "350.00",
        short_description: "<p>Módulo <strong>bifacial</strong></p>",
        stock_status: "instock",
        images: [{ src: "/catalog/owner/boviet-620w.webp" }],
        categories: [{ name: "Energía solar" }],
      },
      BASE_URL,
    );
    expect(product.slug).toBe("panel-boviet-620w");
    expect(product.sourceSystem).toBe("nexo");
    expect(product.sourceProductId).toBe("42");
    expect(product.category).toBe("energia");
    expect(product.priceUsd).toBe(350);
    expect(product.description).toBe("Módulo bifacial");
    expect(product.imageUrl).toBe("https://nexotienda.casavivadecuba.com/catalog/owner/boviet-620w.webp");
    expect(product.available).toBe(true);
  });

  it("sin descripción corta, usa la descripción larga limpia", () => {
    const product = mapWooProductToCatalogProduct(
      { id: 1, slug: "x", name: "X", price: "5.00", description: "<p>Larga</p>", stock_status: "instock" },
      BASE_URL,
    );
    expect(product.description).toBe("Larga");
  });
});
