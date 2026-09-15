import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatProductPrice } from "@/lib/format";
import { partirNombre } from "@/lib/catalog/nombre";
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
 *
 * Lo que la tarjeta NO lleva, y es a propósito:
 *
 * · El plazo de entrega. «Mismo día», «24 h», «Por confirmar» repetidos en
 *   quince tarjetas son quince etiquetas de colores que no ayudan a elegir
 *   entre un arroz y un aceite. El plazo es de la ficha, que es donde se
 *   decide de verdad.
 *
 * Lo que sí lleva, y se había quitado por error: POR QUÉ algo no se puede
 * comprar. Se quitó pensando que afectaba «a unos pocos productos» y que el
 * botón apagado ya lo decía. Los dos supuestos eran falsos: el 15 de
 * septiembre venció la vigencia de las 19 fichas a la vez y la tienda entera
 * quedó llena de botones apagados sin una palabra de explicación, que es
 * exactamente lo que parece una web rota. Vuelve, pero como una línea
 * discreta y no como la pastilla amarilla de antes.
 */
export default function ProductCard({
  product,
  gydPerUsd,
}: {
  product: CatalogProduct;
  gydPerUsd: number | null;
}) {
  const price = formatProductPrice(product.priceUsd, gydPerUsd);

  // Los nombres de energía vienen de NEXO con la ficha técnica pegada detrás.
  // Se parte para pintarlo; el nombre entero sigue en la ficha del producto y
  // en el `alt` de la foto, que es lo que lee quien no ve la pantalla.
  const { nombre, ficha } = partirNombre(product.name);
  const detalle = product.presentation || ficha;

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
        <span className="product-card-name" title={product.name}>{nombre}</span>
        {detalle && <span className="product-card-presentation">{detalle}</span>}
        <span className="product-card-price">{price.primary}</span>
        {price.secondary && <span className="product-card-price-secondary">{price.secondary}</span>}
        {!product.available && (
          <span className="product-card-motivo">{motivo(product.unavailableReason)}</span>
        )}
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
 * «No disponible» a secas hace pensar que se acabó el producto y que la culpa
 * es del mundo. Cuando lo que pasa es que se nos venció el precio o que la
 * ficha está a medias, el problema es NUESTRO, y decirlo así hace que la
 * persona vuelva en vez de irse pensando que no tenemos nada.
 */
function motivo(razon: CatalogProduct["unavailableReason"]) {
  if (razon === "precio_vencido") return "Confirmando precio";
  if (razon === "ficha_incompleta") return "Preparando la ficha";
  return "Agotado";
}
