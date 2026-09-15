import { getCatalogProvider } from "@/lib/catalog";
import type { CatalogCategory } from "@/lib/catalog/types";
import ProductCard from "./ProductCard";
import CatalogEmptyState from "./CatalogEmptyState";
import Volver from "./Volver";

export default async function CategoryPage({
  category,
  title,
  lead,
  orderedSlugs,
}: {
  category: CatalogCategory;
  title: string;
  lead: string;
  orderedSlugs?: string[];
}) {
  const provider = getCatalogProvider();
  const [result, rate] = await Promise.all([provider.listByCategory(category), provider.getCommercialRate()]);
  const rank = new Map((orderedSlugs ?? []).map((slug, index) => [slug, index]));
  const products = orderedSlugs
    ? [...result.products].sort((a, b) => (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999) || a.name.localeCompare(b.name))
    : result.products;

  return (
    <div className="wrap page-section">
      <Volver href="/tienda">Tienda</Volver>
      <h1 className="page-title">{title}</h1>
      <p className="page-lead">{lead}</p>

      {result.status === "not_configured" || result.status === "error" ? (
        <CatalogEmptyState categoria={title.toLowerCase()} />
      ) : products.length === 0 ? (
        <div className="catalog-empty">
          <h2>Todavía no hay productos activos</h2>
          <p>Vuelve pronto: seguimos preparando este catálogo.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
