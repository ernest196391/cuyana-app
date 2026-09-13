import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCatalogProvider } from "@/lib/catalog";
import { formatProductPrice } from "@/lib/format";
import AddToCartButton from "@/components/store/AddToCartButton";

// Precio, disponibilidad e imagen vienen del catálogo en vivo (NEXO) y de la
// tasa comercial en Supabase: nunca se congela como HTML estático.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const provider = getCatalogProvider();
  const result = await provider.getProduct(params.slug);
  if (!result.product) return { title: "Producto" };
  return {
    title: result.product.name,
    description: result.product.description,
    alternates: { canonical: `/producto/${params.slug}` },
  };
}

export default async function ProductoPage({ params }: { params: { slug: string } }) {
  const provider = getCatalogProvider();
  const [result, rate] = await Promise.all([provider.getProduct(params.slug), provider.getCommercialRate()]);

  if (result.status === "not_configured" || result.status === "error") {
    return (
      <div className="wrap page-section">
        <div className="catalog-empty">
          <h2>Este producto todavía no está disponible</h2>
          <p>El catálogo de la tienda está en preparación. Escríbenos por WhatsApp para más información.</p>
        </div>
      </div>
    );
  }

  if (!result.product) return notFound();

  const product = result.product;
  const price = formatProductPrice(product.priceUsd, rate?.gydPerUsd ?? null);

  return (
    <div className="wrap page-section product-detail">
      <div className="product-detail-img">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 720px) 100vw, 480px" style={{ objectFit: "contain" }} />
        ) : (
          <div className="product-card-img-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="product-detail-info">
        <h1 className="page-title">{product.name}</h1>
        {product.description && <p className="page-lead">{product.description}</p>}
        <p className="product-detail-price">
          {price.primary}
          {price.secondary && <span className="product-card-price-secondary"> · {price.secondary}</span>}
        </p>
        {!product.available && (
          <p className="badge badge-warning product-detail-badge">Ahora mismo no disponible</p>
        )}

        <div className="product-detail-cta-desktop">
          <AddToCartButton product={product} />
        </div>

        {/* La cobertura, justo donde se decide comprar. Enterarse al final de
            que no llega a tu provincia es la peor forma de enterarse. */}
        <p className="product-detail-meta">
          Se entrega en La Habana, en casa de tu familiar. La mensajería se calcula al
          finalizar el pedido, según el municipio.
        </p>
      </div>
      {/* En móvil, el precio y el botón quedan siempre a la vista al fondo
          de la pantalla en vez de requerir bajar hasta el final. */}
      <div className="product-sticky-bar">
        <span className="product-sticky-price">
          {price.primary}
          {price.secondary && <span className="product-card-price-secondary"> · {price.secondary}</span>}
        </span>
        <AddToCartButton product={product} compact />
      </div>
    </div>
  );
}
