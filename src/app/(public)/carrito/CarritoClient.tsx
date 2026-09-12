"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartTotalUsd, clearCart, getCart, removeFromCart, type CartItem } from "@/lib/cart";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import { formatProductPrice } from "@/lib/format";
import { validarPedidoTienda, construirMensajePedidoTienda } from "@/lib/store/orderMessage";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function CarritoClient({ gydPerUsd }: { gydPerUsd: number | null }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const refrescar = () => setItems(getCart());
    refrescar();
    window.addEventListener("cuyana-cart-updated", refrescar);
    return () => window.removeEventListener("cuyana-cart-updated", refrescar);
  }, []);

  const totalUsd = cartTotalUsd(items);
  const totalPrecio = formatProductPrice(totalUsd, gydPerUsd);

  async function confirmarPedido() {
    const error = validarPedidoTienda({ items, customerName, customerWhatsapp });
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setFallo(false);
    setEnviando(true);
    track(ANALYTICS_EVENTS.storeCheckoutRequested, { itemCount: items.length });

    try {
      const response = await fetch("/api/store/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            sourceSystem: item.sourceSystem,
            sourceProductId: item.sourceProductId,
            quantity: item.quantity,
          })),
          customerName,
          customerWhatsapp,
        }),
      });
      const result = await response.json();

      if (result.status !== "ok") {
        setFallo(true);
        setFormError(result.message || "No pudimos registrar tu pedido.");
        return;
      }

      // El pedido ya está guardado (result.orderCode existe en Supabase)
      // antes de construir el enlace de WhatsApp — nunca al revés.
      const mensaje = construirMensajePedidoTienda({
        code: result.orderCode,
        items: items.map((item) => ({ name: item.name, quantity: item.quantity, priceUsd: item.priceUsd })),
        totalUsd,
        totalGyd: gydPerUsd ? Math.round(totalUsd * gydPerUsd) : null,
        customerName,
        customerWhatsapp,
      });
      clearCart();
      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    } catch {
      setFallo(true);
      setFormError("No pudimos registrar tu pedido. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const fallbackMsg = encodeURIComponent(
    `Hola, quiero pedir: ${items.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "(carrito vacío)"}.`,
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
            {items.map((item) => {
              const precio = formatProductPrice(item.priceUsd, gydPerUsd);
              return (
                <li key={item.slug} className="cart-item">
                  <span>{item.name}</span>
                  <span className="mono">
                    {item.quantity} × {precio.primary}
                    {precio.secondary && ` · ${precio.secondary}`}
                  </span>
                  <button type="button" className="btn-secondary" onClick={() => removeFromCart(item.slug)}>
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="cart-total">
            Total: {totalPrecio.primary}
            {totalPrecio.secondary && <span className="product-card-price-secondary"> · {totalPrecio.secondary}</span>}
          </p>

          <div className="field">
            <label htmlFor="cart-nombre">Tu nombre</label>
            <input
              id="cart-nombre"
              className="campo"
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cart-whatsapp">Tu WhatsApp</label>
            <input
              id="cart-whatsapp"
              className="campo"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
            />
          </div>

          <div className="cart-actions">
            <button type="button" className="cta" disabled={enviando} onClick={() => void confirmarPedido()}>
              {enviando ? "Registrando pedido…" : "Confirmar pedido por WhatsApp"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => clearCart()}>
              Vaciar carrito
            </button>
          </div>

          {formError && <p className="calc-error" role="alert">{formError}</p>}

          {fallo && (
            <div className="catalog-empty" style={{ marginTop: 16 }}>
              <p>Mientras tanto, puedes escribirnos directo con tu pedido.</p>
              <a className="cta cta-secondary" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${fallbackMsg}`} target="_blank" rel="noopener">
                Escribir por WhatsApp
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
