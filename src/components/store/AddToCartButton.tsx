"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/catalog/types";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

/**
 * `compact` se usa en la barra fija del pie de la ficha de producto en
 * móvil: sin selector de cantidad propio (queda en 1) para no duplicar ese
 * control con el de la versión de escritorio en la misma página.
 */
export default function AddToCartButton({ product, compact = false, rateAvailable = true }: { product: CatalogProduct; compact?: boolean; rateAvailable?: boolean }) {
  const [quantity, setQuantity] = useState(1);

  function agregar(qty: number) {
    addToCart(
      {
        slug: product.slug,
        sourceSystem: product.sourceSystem,
        sourceProductId: product.sourceProductId,
        name: product.name,
        priceUsd: product.priceUsd,
        category: product.category,
      },
      qty,
    );
    track(ANALYTICS_EVENTS.storeAddToCart, { slug: product.slug, category: product.category, quantity: qty });
  }

  if (compact) {
    return (
      <button type="button" className="cta" disabled={!product.available || !rateAvailable} onClick={() => agregar(1)}>
        {!rateAvailable ? "Precio en actualización" : product.available ? "Añadir al carrito" : "No disponible"}
      </button>
    );
  }

  return (
    <div className="add-to-cart">
      {product.available && (
        <div className="qty-stepper" role="group" aria-label="Cantidad">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Quitar una unidad">
            −
          </button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Agregar una unidad">
            +
          </button>
        </div>
      )}
      <button
        type="button"
        className="cta"
        disabled={!product.available || !rateAvailable}
        onClick={() => {
          agregar(quantity);
          setQuantity(1);
        }}
      >
        {!rateAvailable ? "Precio en actualización" : product.available ? "Añadir al carrito" : "No disponible"}
      </button>
    </div>
  );
}
