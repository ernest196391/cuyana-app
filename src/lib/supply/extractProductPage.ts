export interface ExtractedProductPage {
  price: number | null;
  available: boolean | null;
  currency: string | null;
}

function productNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(productNodes);
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  const own = object["@type"] === "Product" ? [object] : [];
  const graph = productNodes(object["@graph"]);
  return [...own, ...graph];
}

export function extractProductPage(html: string): ExtractedProductPage {
  const scripts = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const script of scripts) {
    try {
      const nodes = productNodes(JSON.parse(script[1].trim()));
      for (const node of nodes) {
        const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        if (!offers || typeof offers !== "object") continue;
        const offer = offers as Record<string, unknown>;
        const price = Number(offer.price ?? offer.lowPrice);
        const availability = String(offer.availability ?? "").toLowerCase();
        return {
          price: Number.isFinite(price) ? price : null,
          available: availability ? !availability.includes("outofstock") && !availability.includes("soldout") : null,
          currency: typeof offer.priceCurrency === "string" ? offer.priceCurrency : null,
        };
      }
    } catch { /* Ignora JSON-LD ajeno o inválido y prueba el siguiente. */ }
  }
  const priceMatch = html.match(/(?:\$\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*\$)/);
  const unavailable = /sin existencias|agotado|out of stock/i.test(html);
  const available = /hay existencias|in stock|añadir al carrito/i.test(html);
  const raw = priceMatch?.[1] ?? priceMatch?.[2];
  return { price: raw ? Number(raw.replace(",", ".")) : null, available: unavailable ? false : available ? true : null, currency: raw ? "USD" : null };
}
