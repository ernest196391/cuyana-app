"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Confirmación visible al agregar un producto, con salida directa al
 * carrito. Antes de esto, "Añadir al carrito" solo cambiaba el texto del
 * botón por 2 segundos y no pasaba nada más — sin el header ya con acceso
 * al carrito (CartIndicator), esto era un callejón sin salida real.
 */
export default function CartToast() {
  const [item, setItem] = useState<{ name: string; quantity: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onAdded(e: Event) {
      const detail = (e as CustomEvent<{ name: string; quantity: number }>).detail;
      setItem(detail);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setItem(null), 4500);
    }
    window.addEventListener("cuyana-cart-added", onAdded);
    return () => {
      window.removeEventListener("cuyana-cart-added", onAdded);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!item) return null;

  return (
    <div className="cart-toast" role="status">
      <div className="cart-toast-text">
        <strong>Añadido al carrito</strong>
        <span>
          {item.quantity} × {item.name}
        </span>
      </div>
      <Link href="/carrito" className="cart-toast-cta" onClick={() => setItem(null)}>
        Ver carrito
      </Link>
      <button type="button" className="cart-toast-close" aria-label="Cerrar" onClick={() => setItem(null)}>
        ×
      </button>
    </div>
  );
}
