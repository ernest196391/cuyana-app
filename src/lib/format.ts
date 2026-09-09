// Formato latinoamericano en toda la app: punto para miles, coma para
// decimales (ej. 10.000 · 21,40) — nunca el formato inglés (10,000 · 21.40).

/** Parsea un monto entero (sin decimales) tecleado en formato latinoamericano. */
export function parseAmount(str: string) {
  const clean = str.replace(/[^0-9.,]/g, "");
  const normalized = clean.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

/** Formatea un monto entero: 10000 -> "10.000". */
export function formatNumber(n: number) {
  return Math.round(n).toLocaleString("es");
}

/** Parsea un número con decimales (ej. tasa "21,40") en formato latinoamericano. */
export function parseDecimal(str: string) {
  const clean = str.replace(/[^0-9.,]/g, "");
  const normalized = clean.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

/** Formatea un número con decimales: 21.4 -> "21,40". */
export function formatDecimal(n: number, digits = 2) {
  return n.toLocaleString("es", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Formatea un porcentaje sin forzar decimales: 5 -> "5", 3.5 -> "3,5". */
export function formatPercent(n: number) {
  return n.toLocaleString("es", { maximumFractionDigits: 2 });
}
