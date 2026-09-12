"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/catalog/types";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function AddToCartButton({ product }: { product: CatalogProduct }) {
  const [quantity, setQuantity] = useState(1);

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
        disabled={!product.available}
        onClick={() => {
          addToCart(
            {
              slug: product.slug,
              sourceSystem: product.sourceSystem,
              sourceProductId: product.sourceProductId,
              name: product.name,
              priceUsd: product.priceUsd,
              category: product.category,
            },
            quantity,
          );
          track(ANALYTICS_EVENTS.storeAddToCart, { slug: product.slug, category: product.category, quantity });
          setQuantity(1);
        }}
      >
        {product.available ? "Añadir al carrito" : "No disponible"}
      </button>
    </div>
  );
}
