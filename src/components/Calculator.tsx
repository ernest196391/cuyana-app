"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useDeliveryMethods } from "@/lib/useDeliveryMethods";
import { supabase } from "@/lib/supabase";
import { parseAmount, formatNumber, formatMoney, roundMoney } from "@/lib/format";
import Skeleton from "./Skeleton";

// Número de WhatsApp del negocio (formato internacional, sin + ni espacios)
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5355879222";

/** Permisiva a propósito: no se rechaza por formato de país. */
function telefonoPlausible(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}

export default function Calculator() {
  const { methods, status } = useDeliveryMethods();

  const [sendValue, setSendValue] = useState(() => formatNumber(10000));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRef(params.get("ref"));
  }, []);

  // El primer método activo queda seleccionado en cuanto cargan.
  useEffect(() => {
    if (selectedKey === null && methods.length > 0) {
      setSelectedKey(methods[0].key);
    }
  }, [methods, selectedKey]);

  const method = methods.find((m) => m.key === selectedKey) ?? methods[0] ?? null;

  const gyd = parseAmount(sendValue);
  const montoDestino = method ? roundMoney(gyd * method.rate_per_gyd, method.target_currency) : 0;

  const mensaje = useMemo(() => {
    if (!method) return "";
    let msg =
      `Hola Adonys, soy ${customerName.trim()}, quiero mandar ${formatNumber(gyd)} GYD ` +
      `para que mi familia en Cuba reciba ${formatMoney(montoDestino, method.target_currency)} ` +
      `${method.target_currency} por ${method.label}.`;
    if (ref) msg += ` (Referido: ${ref})`;
    return msg;
  }, [customerName, gyd, montoDestino, method, ref]);

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

  function handleBlur() {
    setSendValue(gyd > 0 ? formatNumber(gyd) : "");
  }

  function validar(): string | null {
    if (!method) return "Todavía estamos cargando los métodos de entrega.";
    if (gyd <= 0) return "Escribe cuánto quieres enviar.";
    // El monto destino redondeado debe ser mayor a cero: con USD, un monto muy
    // pequeño redondea a 0,00 y el pedido no tendría sentido.
    if (montoDestino <= 0) return "Ese monto es demasiado bajo para este método de entrega.";
    if (customerName.trim().length < 2) return "Escribe tu nombre.";
    if (!telefonoPlausible(customerPhone)) return "Escribe un número de WhatsApp válido.";
    return null;
  }

  async function guardarPedido() {
    if (!supabase || !method) return;
    try {
      const { error } = await supabase.from("orders").insert({
        amount_gyd: gyd,
        amount_cup: montoDestino,
        customer_name: customerName.trim(),
        customer_whatsapp: customerPhone.trim(),
        method_key: method.key,
        rate_used: method.rate_per_gyd,
        ref_code: ref || null,
        sent_to_whatsapp: true,
      });
      if (error) throw error;
    } catch (err) {
      console.error("No se pudo registrar el pedido en Supabase", err);
    }
  }

  function handleSubmit(e: MouseEvent<HTMLAnchorElement>) {
    const error = validar();
    if (error) {
      e.preventDefault();
      setFormError(error);
      return;
    }
    setFormError(null);
    // Sin await: la navegación a WhatsApp ocurre dentro del gesto del usuario,
    // que es lo que evita que el navegador la bloquee.
    void guardarPedido();
  }

  return (
    <div className="calc">
      <div className="field">
        <label htmlFor="send">Envías desde Guyana</label>
        <div className="input-row">
          <span className="cur">GYD</span>
          <input
            type="text"
            inputMode="numeric"
            id="send"
            autoComplete="off"
            value={sendValue}
            onChange={(e) => setSendValue(e.target.value)}
            onBlur={handleBlur}
          />
        </div>
      </div>

      <div className="field">
        <label>¿Cómo lo recibe tu familia?</label>
        {status === "loading" ? (
          <Skeleton width="100%" />
        ) : (
          <div className="metodos">
            {methods.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`metodo${m.key === method?.key ? " activo" : ""}`}
                onClick={() => setSelectedKey(m.key)}
                aria-pressed={m.key === method?.key}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="result">
        <label>Tu familia recibe</label>
        <div className="amount">
          {status === "loading" ? (
            <Skeleton width="5em" dark />
          ) : (
            <span>{gyd > 0 && method ? formatMoney(montoDestino, method.target_currency) : "—"}</span>
          )}
          <span>{method?.target_currency ?? ""}</span>
        </div>
        {method?.note && <p className="result-note">{method.note}</p>}
      </div>

      <div className="field">
        <label htmlFor="nombre">Tu nombre</label>
        <input
          id="nombre"
          className="campo"
          type="text"
          autoComplete="name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="whatsapp">Tu WhatsApp</label>
        <input
          id="whatsapp"
          className="campo"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />
      </div>

      <a className="cta" id="waBtn" href={waHref} target="_blank" rel="noopener" onClick={handleSubmit}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.29-1.39a9.9 9.9 0 0 0 4.7 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.07c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.41.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.26 1.63 2.04 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.21.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.15.48.22.55.34.07.13.07.72-.17 1.4z" />
        </svg>
        Pedir esta remesa por WhatsApp
      </a>
      {formError && <p className="calc-error">{formError}</p>}
      <p className="calc-note">La comisión ya está incluida en la tasa. Nada que sumar después.</p>
    </div>
  );
}
