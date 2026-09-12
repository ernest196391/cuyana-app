"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartTotalUsd, clearCart, getCart, removeFromCart, type CartItem } from "@/lib/cart";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function CarritoClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  useEffect(() => {
    const refrescar = () => setItems(getCart());
    refrescar();
    window.addEventListener("cuyana-cart-updated", refrescar);
    return () => window.removeEventListener("cuyana-cart-updated", refrescar);
  }, []);

  const total = cartTotalUsd(items);

  function solicitarPedido() {
    track(ANALYTICS_EVENTS.storeCheckoutRequested, { itemCount: items.length });
    // La tienda todavía no tiene integración real con el sistema canónico
    // (Product Studio One / NEXO): no se crea un pedido falso. Se ofrece un
    // resumen honesto y un canal para confirmar por WhatsApp.
    setCheckoutMessage(
      "El pedido en línea de la tienda todavía está en preparación. Te confirmamos disponibilidad y precio por WhatsApp antes de cobrar nada."
    );
  }

  const resumen = items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
  const waMsg = encodeURIComponent(
    `Hola, quiero pedir: ${resumen || "(carrito vacío)"}. Total referencia: ${total.toFixed(2)} USD.`
  );

  return (
    <div className="wrap page-section">
      <h1 className="page-title">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="catalog-empty">
          <h2>Tu carrito está vacío</h2>
          <p>
            Explora la <Link href="/tienda">tienda</Link> para agregar alimentos o energía.
          </p>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.slug} className="cart-item">
                <span>{item.name}</span>
                <span className="mono">
                  {item.quantity} × {item.priceUsd.toFixed(2)} USD
                </span>
                <button type="button" className="btn-secondary" onClick={() => removeFromCart(item.slug)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p className="cart-total">Total: {total.toFixed(2)} USD</p>

          <div className="cart-actions">
            <button type="button" className="cta" onClick={solicitarPedido}>
              Solicitar pedido
            </button>
            <button type="button" className="btn-secondary" onClick={() => clearCart()}>
              Vaciar carrito
            </button>
          </div>

          {checkoutMessage && (
            <div className="catalog-empty" style={{ marginTop: 16 }}>
              <p>{checkoutMessage}</p>
              <a className="cta cta-secondary" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`} target="_blank" rel="noopener">
                Confirmar por WhatsApp
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
