import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatProductPrice } from "@/lib/format";

export default function ProductCard({ product, gydPerUsd }: { product: CatalogProduct; gydPerUsd: number | null }) {
  const price = formatProductPrice(product.priceUsd, gydPerUsd);
  return (
    <Link href={`/producto/${product.slug}`} className="product-card">
      <div className="product-card-img">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 720px) 50vw, 260px" />
        ) : (
          <div className="product-card-img-placeholder" aria-hidden="true" />
        )}
      </div>
      <span className="product-card-name">{product.name}</span>
      <span className="product-card-price">
        {price.primary}
        {price.secondary && <span className="product-card-price-secondary"> · {price.secondary}</span>}
      </span>
      {!product.available && <span className="badge badge-warning">No disponible</span>}
    </Link>
  );
}
