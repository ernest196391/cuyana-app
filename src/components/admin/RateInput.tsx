"use client";

import {
  formatMoney,
  formatNumber,
  parseDecimal,
  roundMoney,
  roundRate,
  tasaSeLeeInvertida,
} from "@/lib/format";

/** Monto de muestra de la previsualización: redondo y realista. */
const MUESTRA_GYD = 10000;

export type Direccion = "directa" | "invertida";

/**
 * Nadie razona en "0,00363636 USD por GYD"; sí en "275 GYD = 1 USD". La
 * dirección la sugiere la magnitud de la tasa vigente, no la moneda, para que
 * siga funcionando con monedas que se agreguen después.
 */
export function direccionSugerida(rate: number): Direccion {
  return tasaSeLeeInvertida(rate) ? "invertida" : "directa";
}

/** Lo tecleado -> rate_per_gyd, ya redondeado a lo que la base puede guardar. */
export function tasaDesdeTexto(texto: string, direccion: Direccion) {
  const n = parseDecimal(texto);
  if (!(n > 0)) return 0;
  return roundRate(direccion === "invertida" ? 1 / n : n);
}

export default function RateInput({
  id,
  currency,
  valor,
  onValor,
  direccion,
  onDireccion,
}: {
  id: string;
  currency: string;
  valor: string;
  onValor: (v: string) => void;
  direccion: Direccion;
  onDireccion: (d: Direccion) => void;
}) {
  const moneda = currency || "…";
  const tasa = tasaDesdeTexto(valor, direccion);
  const recibe = roundMoney(MUESTRA_GYD * tasa, currency);

  return (
    <div className="admin-rate-input">
      <div className="admin-dir-toggle" role="group" aria-label="Dirección de la tasa">
        <button
          type="button"
          className={`admin-dir${direccion === "directa" ? " on" : ""}`}
          aria-pressed={direccion === "directa"}
          onClick={() => onDireccion("directa")}
        >
          1 GYD = ? {moneda}
        </button>
        <button
          type="button"
          className={`admin-dir${direccion === "invertida" ? " on" : ""}`}
          aria-pressed={direccion === "invertida"}
          onClick={() => onDireccion("invertida")}
        >
          ? GYD = 1 {moneda}
        </button>
      </div>

      <div className="admin-rate-row">
        {direccion === "directa" ? (
          <>
            <span className="admin-rate-fix">1 GYD =</span>
            <input
              id={id}
              className="admin-input admin-rate-field"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={valor}
              onChange={(e) => onValor(e.target.value)}
            />
            <span className="admin-rate-fix">{moneda}</span>
          </>
        ) : (
          <>
            <input
              id={id}
              className="admin-input admin-rate-field"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={valor}
              onChange={(e) => onValor(e.target.value)}
            />
            <span className="admin-rate-fix">GYD = 1 {moneda}</span>
          </>
        )}
      </div>

      {/* La red de seguridad: antes de confirmar se ve, en plata, qué va a
          recibir un cliente que mande 10.000 GYD con esta tasa. */}
      <p className="admin-rate-preview">
        {tasa > 0 && currency ? (
          <>
            {formatNumber(MUESTRA_GYD)} GYD → <b>{formatMoney(recibe, currency)} {currency}</b>
          </>
        ) : (
          "Escribe la tasa para ver cuánto recibiría un cliente."
        )}
      </p>
    </div>
  );
}
