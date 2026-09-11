import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCatalogProvider } from "@/lib/catalog";
import { formatProductPrice } from "@/lib/format";
import AddToCartButton from "@/components/store/AddToCartButton";

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
          <Image src={product.imageUrl} alt={product.name} width={640} height={640} sizes="(max-width: 720px) 100vw, 480px" />
        ) : (
          <div className="product-card-img-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="product-detail-info">
        <h1 className="page-title">{product.name}</h1>
        <p className="page-lead">{product.description}</p>
        <p className="product-detail-price">
          {price.primary}
          {price.secondary && <span className="product-card-price-secondary"> · {price.secondary}</span>}
        </p>
        <AddToCartButton product={product} />
        <p className="product-detail-meta">
          Fuente: {product.sourceSystem} · sincronizado {new Date(product.syncedAt).toLocaleDateString("es")}
        </p>
      </div>
    </div>
  );
}
