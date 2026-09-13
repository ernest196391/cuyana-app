import type { CatalogListResult, CatalogProduct, CatalogProductResult } from "./types";
import { marketSupabase } from "./marketSupabase";

type PublicCatalogRow = {
  product_id: string;
  slug: string;
  name: string;
  kind: "product" | "bundle";
  category: "alimentos" | "hogar";
  description: string;
  presentation: string | null;
  composition: string[] | null;
  substitution_policy: string | null;
  price_usd: number | string;
  available: boolean;
  eta_text: string | null;
  image_url: string | null;
  source_checked_at: string;
};

export function mapPublicFoodRow(row: PublicCatalogRow): CatalogProduct {
  return {
    slug: row.slug,
    sourceSystem: "cuyana-market",
    sourceProductId: row.product_id,
    syncedAt: row.source_checked_at,
    category: "alimentos",
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
  };
}

export async function listCuyanaFoodProducts(): Promise<CatalogListResult> {
  const { data, error } = await marketSupabase.from("market_public_catalog").select("*").eq("category", "alimentos").order("kind", { ascending: true }).order("name");
  if (error) return { status: "error", products: [], message: "No pudimos actualizar el catálogo de alimentos." };
  const products = (data as PublicCatalogRow[]).map(mapPublicFoodRow);
  return { status: products.length ? "ok" : "empty", products };
}

export async function getCuyanaFoodProduct(slug: string): Promise<CatalogProductResult> {
  const { data, error } = await marketSupabase.from("market_public_catalog").select("*").eq("slug", slug).maybeSingle();
  if (error) return { status: "error", product: null, message: "No pudimos actualizar este producto." };
  return data ? { status: "ok", product: mapPublicFoodRow(data as PublicCatalogRow) } : { status: "empty", product: null };
}
