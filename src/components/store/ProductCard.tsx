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
 * · El motivo de que algo no se pueda comprar. El botón ya sale apagado y
 *   diciendo «No disponible»: repetirlo arriba en una pastilla amarilla es
 *   decir dos veces lo mismo y ensuciar la rejilla entera por unos pocos.
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
      </Link>

      {/* Poder añadir sin entrar al producto es media tienda: quien ya sabe lo
          que quiere no tiene por qué dar dos pasos más para pedirlo. */}
      <div className="product-card-add">
        <AddToCartButton product={product} compact rateAvailable={Boolean(gydPerUsd)} />
      </div>
    </article>
  );
}
