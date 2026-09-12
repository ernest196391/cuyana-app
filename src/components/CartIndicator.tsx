"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, cartCount } from "@/lib/cart";

/**
 * Ícono de carrito con contador en el header. Sin esto no hay ninguna forma
 * de llegar a /carrito después de agregar un producto (auditoría de tienda,
 * 2026-09-12): agregar quedaba en un callejón sin salida.
 */
export default function CartIndicator() {
  // Arranca en 0 para que el HTML del servidor y el primer render del
  // cliente coincidan (localStorage no existe en el servidor); se
  // actualiza al montar y en cada cambio del carrito.
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refrescar = () => setCount(cartCount(getCart()));
    refrescar();
    window.addEventListener("cuyana-cart-updated", refrescar);
    return () => window.removeEventListener("cuyana-cart-updated", refrescar);
  }, []);

  return (
    <Link href="/carrito" className="cart-indicator" aria-label={`Carrito${count > 0 ? `, ${count} producto${count === 1 ? "" : "s"}` : ""}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <span className="cart-indicator-badge">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
