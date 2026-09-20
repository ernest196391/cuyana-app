import type { CatalogCategory, CatalogListResult, CatalogProduct, CatalogProductResult } from "./types";
import { marketSupabase } from "./marketSupabase";
import { aplicarVigencia } from "./vigencia";

type PublicCatalogRow = {
  product_id: string;
  slug: string;
  name: string;
  kind: "product" | "bundle";
  category: "alimentos" | "hogar" | "electrodomesticos";
  description: string;
  presentation: string | null;
  composition: string[] | null;
  substitution_policy: string | null;
  price_usd: number | string;
  available: boolean;
  eta_text: string | null;
  image_url: string | null;
  source_checked_at: string;
  /** Hasta cuándo vale el precio que trae esta fila. */
  valid_until: string | null;
  delivery_location?: string | null;
  data_quality_note?: string | null;
};

type MarketCategory = Extract<CatalogCategory, "alimentos" | "electrodomesticos">;

function mapPublicMarketRow(row: PublicCatalogRow, category: MarketCategory): CatalogProduct {
  return {
    slug: row.slug,
    sourceSystem: "cuyana-market",
    sourceProductId: row.product_id,
    syncedAt: row.source_checked_at,
    category,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    priceUsd: Number(row.price_usd),
    available: row.available,
    kind: row.kind,
    presentation: row.presentation,
    composition: row.composition,
    substitutionPolicy: row.substitution_policy,
    eta: row.eta_text,
    deliveryLocation: row.delivery_location ?? null,
    dataQualityNote: row.data_quality_note ?? null,
  };
}

/** Compatibilidad con los tests y consumidores FOOD existentes. */
export function mapPublicFoodRow(row: PublicCatalogRow): CatalogProduct {
  return mapPublicMarketRow(row, "alimentos");
}

export async function listCuyanaMarketProducts(category: MarketCategory): Promise<CatalogListResult> {
  const { data, error } = await marketSupabase
    .from("market_public_catalog")
    .select("*")
    .eq("category", category)
    .order("kind", { ascending: true })
    .order("name");

  if (error) {
    return {
      status: "error",
      products: [],
      message: `No pudimos actualizar el catálogo de ${category === "alimentos" ? "alimentos" : "electrodomésticos"}.`,
    };
  }

  // Vigencia y ficha se comprueban aquí para que grid, ficha y checkout lean
  // exactamente la misma verdad comercial.
  const products = (data as PublicCatalogRow[]).map((row) =>
    aplicarVigencia(mapPublicMarketRow(row, category), row.valid_until),
  );
  return { status: products.length ? "ok" : "empty", products };
}

export async function listCuyanaFoodProducts(): Promise<CatalogListResult> {
  return listCuyanaMarketProducts("alimentos");
}

export async function listCuyanaElectrodomesticosProducts(): Promise<CatalogListResult> {
  return listCuyanaMarketProducts("electrodomesticos");
}

export async function getCuyanaMarketProduct(slug: string): Promise<CatalogProductResult> {
  const { data, error } = await marketSupabase
    .from("market_public_catalog")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { status: "error", product: null, message: "No pudimos actualizar este producto." };
  if (!data) return { status: "empty", product: null };

  const row = data as PublicCatalogRow;
  const category: MarketCategory = row.category === "electrodomesticos" || row.category === "hogar"
    ? "electrodomesticos"
    : "alimentos";
  return { status: "ok", product: aplicarVigencia(mapPublicMarketRow(row, category), row.valid_until) };
}

export async function getCuyanaFoodProduct(slug: string): Promise<CatalogProductResult> {
  const result = await getCuyanaMarketProduct(slug);
  if (result.status !== "ok" || result.product?.category === "alimentos") return result;
  return { status: "empty", product: null };
}
