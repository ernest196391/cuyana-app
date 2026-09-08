"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveRate } from "@/lib/useLiveRate";
import { supabase } from "@/lib/supabase";

// Número de WhatsApp del negocio (formato internacional, sin + ni espacios)
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5219999999999"; // PLACEHOLDER — reemplazar con el número real

function parseAmount(str: string) {
  const clean = str.replace(/[^0-9.]/g, "");
  return parseFloat(clean) || 0;
}

function formatNumber(n: number) {
  return Math.round(n).toLocaleString("es");
}

export default function Calculator() {
  const rate = useLiveRate();
  const [sendValue, setSendValue] = useState("10,000");
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRef(params.get("ref"));
  }, []);

  const gyd = parseAmount(sendValue);
  const cup = rate ? gyd * rate : 0;

  const waHref = useMemo(() => {
    let msg = `Hola Adonys, estoy interesado en mandar ${formatNumber(
      gyd
    )} GYD para que mi familia en Cuba reciba ${formatNumber(cup)} CUP.`;
    if (ref) msg += ` (Referido: ${ref})`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [gyd, cup, ref]);

  function handleBlur() {
    setSendValue(gyd > 0 ? formatNumber(gyd) : "");
  }

  async function handleWhatsAppClick() {
    if (!rate || gyd <= 0) return;
    try {
      const { error } = await supabase.from("orders").insert({
        amount_gyd: gyd,
        amount_cup: cup,
        ref_code: ref || null,
        sent_to_whatsapp: true,
      });
      if (error) throw error;
    } catch (err) {
      console.error("No se pudo registrar el pedido en Supabase", err);
    }
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

      <div className="result">
        <label>Tu familia recibe en Cuba</label>
        <div className="amount">
          <span>{gyd > 0 && rate ? formatNumber(cup) : "—"}</span>
          <span>CUP</span>
        </div>
      </div>

      <a className="cta" id="waBtn" href={waHref} target="_blank" rel="noopener" onClick={handleWhatsAppClick}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.29-1.39a9.9 9.9 0 0 0 4.7 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.07c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.41.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.26 1.63 2.04 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.21.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.15.48.22.55.34.07.13.07.72-.17 1.4z" />
        </svg>
        Pedir esta remesa por WhatsApp
      </a>
      <p className="calc-note">La comisión ya está incluida en la tasa. Nada que sumar después.</p>
    </div>
  );
}
