import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatProductPrice } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";

/**
 * Una tarjeta del catálogo.
 *
 * El enlace envuelve la foto, el nombre y el precio, pero NO el botón: un
 * `<button>` dentro de un `<a>` es HTML inválido y rompe el teclado y los
 * lectores de pantalla. Para que aun así se pueda pulsar en cualquier parte de
 * la tarjeta, el enlace se estira por encima con un `::after` y el botón queda
 * por delante (ver `.product-card-add` en globals.css). Así hay un enlace y un
 * botón, cada uno con su papel, sin anidarlos.
 */
export default function ProductCard({
  product,
  gydPerUsd,
}: {
  product: CatalogProduct;
  gydPerUsd: number | null;
}) {
  const price = formatProductPrice(product.priceUsd, gydPerUsd);
  const eta = product.eta ? shortEta(product.eta) : null;
  return (
    <article className="product-card">
      <Link href={`/producto/${product.slug}`} className="product-card-link">
        <div className="product-card-img">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 720px) 50vw, 260px" />
          ) : (
            <div className="product-card-img-placeholder" aria-hidden="true" />
          )}
        </div>
        <span className="product-card-name">{product.name}</span>
        {product.presentation && <span className="product-card-presentation">{product.presentation}</span>}
        <span className="product-card-price">{price.primary}</span>
        {price.secondary && <span className="product-card-price-secondary">{price.secondary}</span>}
        {!product.available && (
          <span className="badge badge-warning">{motivo(product.unavailableReason)}</span>
        )}
        {product.available && eta && <span className="product-card-eta">{eta}</span>}
      </Link>

      {/* Poder añadir sin entrar al producto es media tienda: quien ya sabe lo
          que quiere no tiene por qué dar dos pasos más para pedirlo. */}
      <div className="product-card-add">
        <AddToCartButton product={product} compact rateAvailable={Boolean(gydPerUsd)} />
      </div>
    </article>
  );
}

/**
 * Por qué no se puede comprar, dicho para quien lo lee.
 *
 * «No disponible» a secas hace pensar que se acabó. Si lo que pasa es que se
 * nos venció el precio o que la ficha está a medias, el problema es nuestro y
 * conviene decirlo así: la persona vuelve, en vez de irse pensando que no
 * tenemos nada.
 */
function motivo(razon: CatalogProduct["unavailableReason"]) {
  if (razon === "precio_vencido") return "Confirmando precio";
  if (razon === "ficha_incompleta") return "Preparando la ficha";
  return "No disponible";
}

function shortEta(eta: string) {
  const value = eta.toLowerCase();
  if (value.includes("mismo día")) return "Mismo día";
  if (value.includes("24–48") || value.includes("24-48")) return "24–48 h";
  if (value.includes("24")) return "24 h";
  return "Por confirmar";
}
