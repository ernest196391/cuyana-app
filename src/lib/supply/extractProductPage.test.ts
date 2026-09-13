import { describe, expect, it } from "vitest";
import { extractProductPage } from "./extractProductPage";

describe("extracción pública de oferta", () => {
  it("prefiere Product JSON-LD", () => {
    const html = `<script type="application/ld+json">{"@type":"Product","offers":{"price":"27.95","priceCurrency":"USD","availability":"https://schema.org/InStock"}}</script>`;
    expect(extractProductPage(html)).toEqual({ price: 27.95, currency: "USD", available: true });
  });
  it("reconoce un producto agotado aunque tenga precio", () => {
    expect(extractProductPage("<h1>Combo</h1><p>$39.95</p><p>Sin existencias</p>")).toEqual({ price: 39.95, currency: "USD", available: false });
  });
});
