"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartTotalUsd, clearCart, getCart, updateQuantity, type CartItem } from "@/lib/cart";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import { formatProductPrice } from "@/lib/format";
import { validarPedidoTienda, construirMensajePedidoTienda } from "@/lib/store/orderMessage";
import { catalogoDeEntrega, cotizar, zonasDe } from "@/lib/store/mensajeria";
import { formatNumber } from "@/lib/format";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import { useCuenta } from "@/lib/cuenta";
import { COLUMNAS_FAMILIAR, type Familiar } from "@/lib/familiares";

/** Lo que se elige en los desplegables. Solo La Habana, por ahora. */
const ENTREGA = catalogoDeEntrega();
/** Para cuando el barrio no esté en la lista: se coordina y no se cobra a ciegas. */
const OTRA_ZONA = "__otra";

export default function CarritoClient({ gydPerUsd }: { gydPerUsd: number | null }) {
  const { user, perfil } = useCuenta();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  // Si trae cuenta, sus datos ya los tenemos. Solo se rellena lo vacío: pisar
  // un campo mientras alguien escribe en él es peor que no ayudar.
  const [tocoNombre, setTocoNombre] = useState(false);
  const [tocoWhatsapp, setTocoWhatsapp] = useState(false);
  useEffect(() => {
    if (!perfil) return;
    if (!tocoNombre && perfil.full_name) setCustomerName((v) => (v ? v : perfil.full_name!));
    if (!tocoWhatsapp && perfil.phone) setCustomerWhatsapp((v) => (v ? v : perfil.phone!));
  }, [perfil, tocoNombre, tocoWhatsapp]);

  // Los familiares que ya tiene guardados. Se ofrecen para elegir, pero los
  // campos siguen ahí y se pueden corregir: el que eligió a su hermana quizá
  // esta vez manda a la misma casa con otro teléfono.
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  useEffect(() => {
    if (!user || !supabase) return;
    let vivo = true;
    (async () => {
      const { data } = await supabase!
        .from("customer_beneficiaries")
        .select(COLUMNAS_FAMILIAR)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (vivo) setFamiliares((data ?? []) as Familiar[]);
    })();
    return () => { vivo = false; };
  }, [user]);

  function usarFamiliar(id: string) {
    const f = familiares.find((x) => x.id === id);
    if (!f) return;
    setDestNombre(f.full_name);
    setDestTelefono(f.phone ?? "");
    setDestMunicipio(f.municipio ?? "");
    // La zona solo se pone si sigue existiendo en la tabla de tarifas: si un
    // reparto cambió de nombre, es mejor que lo vuelva a elegir que cobrarle
    // una mensajería calculada sobre una zona que ya no está.
    setDestZona(f.municipio && f.zona && zonasDe(f.municipio).includes(f.zona) ? f.zona : "");
    setDestDireccion(f.direccion ?? "");
    setDestReferencia(f.referencia ?? "");
  }
  // Quien recibe en Cuba. Es otra persona que quien paga, y sin esto el pedido
  // no se puede llevar a ninguna puerta.
  const [destNombre, setDestNombre] = useState("");
  const [destTelefono, setDestTelefono] = useState("");
  const [destMunicipio, setDestMunicipio] = useState("");
  const [destZona, setDestZona] = useState("");
  const [destDireccion, setDestDireccion] = useState("");
  const [destReferencia, setDestReferencia] = useState("");
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

  const zonas = destMunicipio ? zonasDe(destMunicipio) : [];
  const destino = {
    nombre: destNombre,
    telefono: destTelefono,
    municipio: destMunicipio,
    zona: destZona === OTRA_ZONA ? "" : destZona,
    direccion: destDireccion,
    referencia: destReferencia,
  };
  // Se cotiza según se elige, no al final: nadie debería descubrir lo que
  // cuesta la mensajería después de haber dado todos sus datos.
  const envio = destMunicipio ? cotizar(destMunicipio, destino.zona) : null;
  const mensajeriaCup = envio?.estado === "zona" ? envio.cup : null;

  async function confirmarPedido() {
    const error = validarPedidoTienda({ items, customerName, customerWhatsapp, destino });
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setFallo(false);
    setEnviando(true);
    track(ANALYTICS_EVENTS.storeCheckoutRequested, { itemCount: items.length });

    try {
      // El token va en la cabecera y NO el id del usuario en el cuerpo: el
      // servidor pregunta de quién es ese token en vez de creerse un número.
      const { data: sesion } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
      const response = await fetch("/api/store/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sesion.session ? { Authorization: `Bearer ${sesion.session.access_token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            sourceSystem: item.sourceSystem,
            sourceProductId: item.sourceProductId,
            quantity: item.quantity,
          })),
          customerName,
          customerWhatsapp,
          destino,
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
        destino,
        mensajeriaCup,
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

          <h2 className="cart-seccion">¿Quién lo recibe en Cuba?</h2>
          <p className="cart-seccion-nota">
            Por ahora entregamos solo en La Habana. Pronto en más provincias.
          </p>

          {familiares.length > 0 && (
            <div className="field">
              <label htmlFor="dest-guardado">Alguien que ya tienes guardado</label>
              <select
                id="dest-guardado"
                className="campo"
                defaultValue=""
                onChange={(e) => usarFamiliar(e.target.value)}
              >
                <option value="">Escribirlo a mano</option>
                {familiares.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name}
                    {f.municipio ? ` — ${f.municipio}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="dest-nombre">Nombre y apellidos</label>
            <input
              id="dest-nombre"
              className="campo"
              type="text"
              value={destNombre}
              onChange={(e) => setDestNombre(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="dest-telefono">Su teléfono en Cuba</label>
            <input
              id="dest-telefono"
              className="campo"
              type="tel"
              inputMode="tel"
              placeholder="+53 5 234 5678"
              value={destTelefono}
              onChange={(e) => setDestTelefono(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="dest-municipio">Municipio</label>
            <select
              id="dest-municipio"
              className="campo"
              value={destMunicipio}
              onChange={(e) => {
                setDestMunicipio(e.target.value);
                // El barrio de antes no tiene por qué existir en el municipio
                // nuevo: dejarlo puesto cobraría una tarifa de otro sitio.
                setDestZona("");
              }}
            >
              <option value="">Elige el municipio</option>
              {ENTREGA.municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {zonas.length > 0 && (
            <div className="field">
              <label htmlFor="dest-zona">Barrio o reparto</label>
              <select
                id="dest-zona"
                className="campo"
                value={destZona}
                onChange={(e) => setDestZona(e.target.value)}
              >
                <option value="">Elige el barrio</option>
                {zonas.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
                <option value={OTRA_ZONA}>No está en la lista</option>
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="dest-direccion">Dirección exacta</label>
            <input
              id="dest-direccion"
              className="campo"
              type="text"
              placeholder="Calle 26 #503 e/ 31 y 33, apto 4"
              value={destDireccion}
              onChange={(e) => setDestDireccion(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="dest-referencia">Cómo llegar (opcional)</label>
            <input
              id="dest-referencia"
              className="campo"
              type="text"
              placeholder="Edificio azul, frente a la bodega"
              value={destReferencia}
              onChange={(e) => setDestReferencia(e.target.value)}
            />
          </div>

          {envio && (
            <p className="cart-envio" role="status">
              {envio.estado === "zona" ? (
                <>
                  Mensajería a {envio.etiqueta}:{" "}
                  <strong className="mono">{formatNumber(envio.cup)} CUP</strong>
                </>
              ) : (
                <>
                  Mensajería <strong>a coordinar por WhatsApp</strong>
                  {envio.referenciaCup
                    ? ` — en ${destMunicipio} suele rondar los ${formatNumber(envio.referenciaCup)} CUP.`
                    : "."}
                </>
              )}
            </p>
          )}

          <h2 className="cart-seccion">Tus datos</h2>
          <div className="field">
            <label htmlFor="cart-nombre">Tu nombre</label>
            <input
              id="cart-nombre"
              className="campo"
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => { setTocoNombre(true); setCustomerName(e.target.value); }}
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
              onChange={(e) => { setTocoWhatsapp(true); setCustomerWhatsapp(e.target.value); }}
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
