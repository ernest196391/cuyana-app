// Capa de red hacia el catálogo público de solo lectura de Product Studio
// One / NEXO (`/api/marketplace/products`, WooCommerce por debajo). Nunca se
// usa el checkout ni el sistema de gestoras de NEXO desde aquí — Cuyana solo
// lee producto/precio/imagen y arma su propio pedido y su propio WhatsApp.
import type { CatalogProduct } from "./types";
import { isEnergiaCategory } from "./nexoCategories";

type WooImage = { src?: string; alt?: string };
type WooCategory = { id?: number; name?: string };
type WooProduct = {
  id: number;
  slug: string;
  name: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  short_description?: string;
  description?: string;
  stock_status?: string;
  purchasable?: boolean;
  images?: WooImage[];
  categories?: WooCategory[];
};

type MarketplaceResponse = {
  products: WooProduct[];
  configured: boolean;
  total?: number;
  error?: string;
};

const PER_PAGE = 50;
const MAX_PAGES = 6; // techo defensivo: hasta 300 productos, suficiente hoy.
const FETCH_TIMEOUT_MS = 10_000;

export type NexoFetchResult =
  | { ok: true; products: WooProduct[] }
  | { ok: false; message: string };

function stripHtml(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Algunas imágenes del catálogo NEXO son rutas relativas a su propio
 * dominio (ej. "/catalog/owner/boviet-620w.webp"); hay que resolverlas
 * contra el origin de NEXO o no cargan desde Cuyana. */
export function resolveNexoImageUrl(src: string | undefined, baseUrl: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  try {
    return new URL(src, new URL(baseUrl).origin).toString();
  } catch {
    return null;
  }
}

function priceOf(product: WooProduct): number {
  const raw = product.price || product.regular_price || "0";
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

export function isAvailable(product: WooProduct): boolean {
  return product.stock_status === "instock" && product.purchasable !== false && priceOf(product) > 0;
}

export function mapWooProductToCatalogProduct(product: WooProduct, baseUrl: string): CatalogProduct {
  return {
    slug: product.slug,
    sourceSystem: "nexo",
    sourceProductId: String(product.id),
    syncedAt: new Date().toISOString(),
    category: "energia",
    name: product.name,
    description: stripHtml(product.short_description) || stripHtml(product.description),
    imageUrl: resolveNexoImageUrl(product.images?.[0]?.src, baseUrl),
    priceUsd: priceOf(product),
    available: isAvailable(product),
  };
}

/**
 * Trae todo el catálogo público paginado de NEXO. El parámetro `category`
 * del endpoint espera un ID numérico de WooCommerce, no un slug, así que no
 * se usa aquí: se trae todo y se filtra por nombre de categoría en cliente,
 * igual que hace la propia tienda NEXO (ver nexoCategories.ts).
 */
export async function fetchAllNexoProducts(baseUrl: string, apiKey: string): Promise<NexoFetchResult> {
  const products: WooProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // El endpoint de NEXO fija perPage=50 internamente y solo respeta `page`.
    const url = new URL(baseUrl);
    url.searchParams.set("page", String(page));

    let response: Response;
    try {
      response = await fetch(url, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      return { ok: false, message: `No se pudo contactar el catálogo NEXO: ${(error as Error).message}` };
    }

    if (!response.ok) {
      return { ok: false, message: `El catálogo NEXO respondió ${response.status}.` };
    }

    let payload: MarketplaceResponse;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, message: "El catálogo NEXO devolvió una respuesta no válida." };
    }

    if (!payload.configured) {
      return { ok: false, message: payload.error || "El catálogo NEXO no está configurado del otro lado." };
    }

    const pageProducts = payload.products || [];
    products.push(...pageProducts);
    if (pageProducts.length < PER_PAGE) break;
  }
  return { ok: true, products };
}

export async function fetchNexoEnergiaProducts(baseUrl: string, apiKey: string) {
  const result = await fetchAllNexoProducts(baseUrl, apiKey);
  if (!result.ok) return result;
  const energia = result.products.filter((product) => isEnergiaCategory(product.categories || []));
  return { ok: true as const, products: energia };
}
