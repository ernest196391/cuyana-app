"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/catalog/types";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function AddToCartButton({ product }: { product: CatalogProduct }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="cta"
      disabled={!product.available}
      onClick={() => {
        addToCart({
          slug: product.slug,
          sourceSystem: product.sourceSystem,
          sourceProductId: product.sourceProductId,
          name: product.name,
          priceUsd: product.priceUsd,
        });
        track(ANALYTICS_EVENTS.storeAddToCart, { slug: product.slug, category: product.category });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? "Añadido" : product.available ? "Añadir al carrito" : "No disponible"}
    </button>
  );
}
