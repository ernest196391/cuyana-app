"use client";

import { useMemo, useState } from "react";
import { WHATSAPP_NUMBER } from "@/lib/config/site";

type Source = "UYU" | "USD";
type Payout = "usd_cash" | "cup_cash" | "cup_transfer";

const payoutOptions: Array<{ key: Payout; label: string; currency: "USD" | "CUP" }> = [
  { key: "usd_cash", label: "USD efectivo", currency: "USD" },
  { key: "cup_cash", label: "CUP efectivo", currency: "CUP" },
  { key: "cup_transfer", label: "Transferencia CUP", currency: "CUP" },
];

const previewRates: Record<`${Source}:${Payout}`, number> = {
  "UYU:usd_cash": 0.024,
  "UYU:cup_cash": 8.4,
  "UYU:cup_transfer": 8.4,
  "USD:usd_cash": 0.94,
  "USD:cup_cash": 329,
  "USD:cup_transfer": 329,
};

function parseAmount(value: string) {
  const amount = Number(value.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: currency === "CUP" ? 0 : 2,
    maximumFractionDigits: currency === "CUP" ? 0 : 2,
  }).format(value);
}

export default function CuruguayCalculator() {
  const [source, setSource] = useState<Source>("UYU");
  const [payout, setPayout] = useState<Payout>("usd_cash");
  const [amountText, setAmountText] = useState("5000");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const option = payoutOptions.find((item) => item.key === payout)!;
  const amount = parseAmount(amountText);
  const rate = previewRates[`${source}:${payout}`];
  const result = amount * rate;

  const message = useMemo(() => [
    "Hola, quiero solicitar una remesa con Curuguay.", "",
    `Nombre: ${name.trim()}`, `WhatsApp: ${phone.trim()}`,
    `Entrego: ${money(amount, source)} ${source}`,
    `Modalidad: ${option.label}`,
    `Cálculo de referencia: ${money(result, option.currency)} ${option.currency}`, "",
    "Quiero confirmar la tasa, disponibilidad y datos para el pago.",
  ].join("\n"), [amount, name, option, phone, result, source]);
  const ready = amount > 0 && name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 7;

  return (
    <div className="curu-calc" id="calculadora">
      <div className="curu-calc-head"><span>Calcula tu envío</span><small>Tasa de referencia · confirma antes de pagar</small></div>
      <div className="curu-segment" aria-label="Moneda que entregas">
        {(["UYU", "USD"] as Source[]).map((currency) => <button key={currency} type="button" className={source === currency ? "active" : ""} onClick={() => setSource(currency)}>{currency === "UYU" ? "Pesos uruguayos" : "Dólares"}</button>)}
      </div>
      <label className="curu-field"><span>Tú entregas</span><span className="curu-money-input"><input inputMode="decimal" value={amountText} onChange={(event) => setAmountText(event.target.value)} /><b>{source}</b></span></label>
      <fieldset className="curu-payouts"><legend>Tu familia recibe</legend>{payoutOptions.map((item) => <button key={item.key} type="button" className={payout === item.key ? "active" : ""} onClick={() => setPayout(item.key)}>{item.label}</button>)}</fieldset>
      <div className="curu-result" aria-live="polite"><span>Recibe aproximadamente</span><strong>{amount ? money(result, option.currency) : "—"} <small>{option.currency}</small></strong></div>
      <div className="curu-contact"><label>Nombre<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" /></label><label>WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Tu número" /></label></div>
      <a className={`curu-submit${ready ? "" : " disabled"}`} aria-disabled={!ready} onClick={(event) => { if (!ready) event.preventDefault(); }} href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">Solicitar por WhatsApp <span aria-hidden="true">→</span></a>
      <p className="curu-fineprint">No envíes dinero hasta que nuestro equipo confirme la operación.</p>
    </div>
  );
}
