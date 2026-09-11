import { getCatalogProvider } from "@/lib/catalog";
import type { CatalogCategory } from "@/lib/catalog/types";
import ProductCard from "./ProductCard";
import CatalogEmptyState from "./CatalogEmptyState";

export default async function CategoryPage({
  category,
  title,
  lead,
}: {
  category: CatalogCategory;
  title: string;
  lead: string;
}) {
  const provider = getCatalogProvider();
  const [result, rate] = await Promise.all([provider.listByCategory(category), provider.getCommercialRate()]);

  return (
    <div className="wrap page-section">
      <h1 className="page-title">{title}</h1>
      <p className="page-lead">{lead}</p>

      {result.status === "not_configured" || result.status === "error" ? (
        <CatalogEmptyState categoria={title.toLowerCase()} />
      ) : result.products.length === 0 ? (
        <div className="catalog-empty">
          <h2>Todavía no hay productos activos</h2>
          <p>Vuelve pronto: seguimos preparando este catálogo.</p>
        </div>
      ) : (
        <div className="product-grid">
          {result.products.map((product) => (
            <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
