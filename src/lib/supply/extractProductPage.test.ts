import { describe, expect, it } from "vitest";
import { extractProductPage, numeroDeTexto } from "./extractProductPage";

describe("extracción pública de oferta", () => {
  it("prefiere Product JSON-LD", () => {
    const html = `<script type="application/ld+json">{"@type":"Product","offers":{"price":"27.95","priceCurrency":"USD","availability":"https://schema.org/InStock"}}</script>`;
    expect(extractProductPage(html)).toEqual({ price: 27.95, currency: "USD", available: true });
  });

  it("reconoce un producto agotado aunque tenga precio", () => {
    expect(extractProductPage("<h1>Combo</h1><p>$39.95</p><p>Sin existencias</p>")).toEqual({
      price: 39.95,
      currency: "USD",
      available: false,
    });
  });

  // Las tres de abajo son las que había que ganar: el 15 de septiembre, 10
  // páginas de alawao se abrieron bien y no soltaron precio porque no llevaban
  // JSON-LD, y el motor las dio por ilegibles y las sacó del escaparate.
  it("lee el precio de una etiqueta meta de Open Graph", () => {
    const html = `<meta property="og:price:amount" content="76.95"><meta property="og:price:currency" content="USD"><p>Añadir al carrito</p>`;
    expect(extractProductPage(html)).toEqual({ price: 76.95, currency: "USD", available: true });
  });

  it("lee microdatos de schema.org", () => {
    const html = `<span itemprop="price" content="21.95">21,95 $</span><meta itemprop="priceCurrency" content="USD"><p>En existencia</p>`;
    expect(extractProductPage(html)).toEqual({ price: 21.95, currency: "USD", available: true });
  });

  it("lee el precio de una tienda WooCommerce corriente", () => {
    const html = `<p class="price"><span class="woocommerce-Price-amount amount"><bdi>$168.95</bdi></span></p><button>Añadir al carrito</button>`;
    expect(extractProductPage(html)).toEqual({ price: 168.95, currency: "USD", available: true });
  });

  it("NO confunde el envío gratis con el precio del producto", () => {
    // El fallo que se evita: el primer «$» de la página es un umbral de envío.
    // Con el lector viejo, ese 50 acababa publicado como precio de venta.
    const html = `
      <div class="aviso">Envío gratis en compras desde $50</div>
      <p class="product-price"><bdi>$168.95</bdi></p>
      <button>Añadir al carrito</button>`;
    expect(extractProductPage(html).price).toBe(168.95);
  });

  it("no da por precio un número suelto sin moneda", () => {
    expect(extractProductPage(`<span class="price-per-unit">12 unidades</span>`).price).toBeNull();
  });

  it("devuelve null cuando la página no tiene precio ninguno", () => {
    expect(extractProductPage("<h1>Página de error</h1><p>No encontrado</p>").price).toBeNull();
  });
});

describe("numeroDeTexto", () => {
  // Un fallo aquí es un factor de mil en el precio de venta, así que se prueba
  // con los dos formatos que se usan a los dos lados del charco.
  it.each([
    ["27.95", 27.95],
    ["27,95", 27.95],
    ["1,234.56", 1234.56],
    ["1.234,56", 1234.56],
    ["$ 1 234,56", 1234.56],
    ["168", 168],
    ["1.500", 1500],
    ["1,500", 1500],
  ])("lee «%s» como %s", (texto, esperado) => {
    expect(numeroDeTexto(texto as string)).toBe(esperado);
  });

  it.each(["", "gratis", "0", "abc"])("no saca número de «%s»", (texto) => {
    expect(numeroDeTexto(texto)).toBeNull();
  });
});
