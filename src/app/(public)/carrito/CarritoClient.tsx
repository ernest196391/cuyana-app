"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartTotalUsd, clearCart, getCart, updateQuantity, type CartItem } from "@/lib/cart";
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
  const [confirmacion, setConfirmacion] = useState<{ code: string; waUrl: string } | null>(null);

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
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
      clearCart();
      // Se abre en pestaña nueva (no se navega fuera) para que, si la
      // persona cierra WhatsApp por error, el código de su pedido siga
      // visible aquí en vez de perderse.
      window.open(waUrl, "_blank", "noopener");
      setConfirmacion({ code: result.orderCode, waUrl });
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

  if (confirmacion) {
    return (
      <div className="wrap page-section">
        <h1 className="page-title">Tu carrito</h1>
        <div className="order-confirmation">
          <h2>Pedido confirmado</h2>
          <p>
            Tu código de pedido es <strong className="mono">{confirmacion.code}</strong>. Guárdalo por si necesitas
            escribirnos de nuevo.
          </p>
          <p>Deberíamos haber abierto WhatsApp en otra pestaña. Si no se abrió:</p>
          <a className="cta" href={confirmacion.waUrl} target="_blank" rel="noopener">
            Abrir WhatsApp
          </a>
          <Link href="/tienda" className="btn-secondary" style={{ marginTop: 12 }}>
            Seguir viendo la tienda
          </Link>
        </div>
      </div>
    );
  }

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
                  <div className="cart-item-info">
                    <span>{item.name}</span>
                    <span className="mono cart-item-unit-price">
                      {precio.primary}
                      {precio.secondary && ` · ${precio.secondary}`}
                    </span>
                  </div>
                  <div className="qty-stepper" role="group" aria-label={`Cantidad de ${item.name}`}>
                    <button type="button" onClick={() => updateQuantity(item.slug, item.quantity - 1)} aria-label="Quitar una unidad">
                      −
                    </button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.slug, item.quantity + 1)} aria-label="Agregar una unidad">
                      +
                    </button>
                  </div>
                  <button type="button" className="cart-item-remove" aria-label={`Quitar ${item.name} del carrito`} onClick={() => updateQuantity(item.slug, 0)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

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

          {formError && <p className="calc-error" role="alert">{formError}</p>}

          {fallo && (
            <div className="catalog-empty" style={{ marginTop: 16 }}>
              <p>Mientras tanto, puedes escribirnos directo con tu pedido.</p>
              <a className="cta cta-secondary" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${fallbackMsg}`} target="_blank" rel="noopener">
                Escribir por WhatsApp
              </a>
            </div>
          )}

          {/* Espaciador para que la barra fija no tape el último campo. */}
          <div className="cart-sticky-spacer" />
          <div className="cart-sticky-bar">
            <span className="cart-sticky-total">
              {totalPrecio.primary}
              {totalPrecio.secondary && <span className="product-card-price-secondary"> · {totalPrecio.secondary}</span>}
            </span>
            <button type="button" className="cta" disabled={enviando} onClick={() => void confirmarPedido()}>
              {enviando ? "Registrando…" : "Confirmar pedido"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
