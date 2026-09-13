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
  return Math.round(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
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

/**
 * Decimales según la moneda destino: CUP no lleva (son montos grandes, los
 * centavos son ruido); cualquier otra moneda lleva 2. Esto vale también para
 * monedas que el admin agregue en el futuro.
 */
function decimalesPara(currency: string) {
  return currency === "CUP" ? 0 : 2;
}

/**
 * Redondea al mismo valor que se le muestra al cliente. Lo que se guarda en la
 * base debe ser exactamente lo que se le prometió, no el número crudo.
 */
export function roundMoney(amount: number, currency: string) {
  const d = decimalesPara(currency);
  const factor = 10 ** d;
  return Math.round(amount * factor) / factor;
}

/** Formatea un monto en su moneda: 32000/CUP -> "32.000", 36.36/USD -> "36,36". */
export function formatMoney(amount: number, currency: string) {
  const d = decimalesPara(currency);
  return amount.toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Un solo formato de fecha y hora en todo el panel. */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- tasas ---------- */

/** La columna rate_per_gyd es numeric(18,8): nunca mandamos más precisión que esa. */
export const RATE_DECIMALS = 8;

/** Redondea una tasa a lo que la base realmente puede guardar. */
export function roundRate(rate: number) {
  const factor = 10 ** RATE_DECIMALS;
  return Math.round(rate * factor) / factor;
}

/**
 * Una tasa menor a 1 se lee al revés: "0,00363636 USD por GYD" no le dice nada
 * a nadie, "275 GYD = 1 USD" sí. La dirección la decide la magnitud, no la
 * moneda, para que valga también con monedas que se agreguen después.
 */
export function tasaSeLeeInvertida(rate: number) {
  return rate > 0 && rate < 1;
}

/** Cuántos GYD cuesta una unidad de la moneda destino. */
export function gydPorUnidad(rate: number) {
  return rate > 0 ? 1 / rate : 0;
}

/** Formatea una tasa cruda con los decimales que haga falta, sin ceros de más. */
export function formatRate(rate: number) {
  return rate.toLocaleString("es", { maximumFractionDigits: RATE_DECIMALS });
}

/**
 * La tasa escrita en la dirección en la que la gente razona:
 *   3.2        / CUP -> "1 GYD = 3,2 CUP"
 *   0.00363636 / USD -> "275 GYD = 1 USD"
 */
/**
 * Precio de producto: GYD primario derivado de la tasa comercial vigente
 * (nunca la de remesas) y USD secundario, el precio canónico. Si no hay
 * tasa comercial vigente, no se inventa una ni se degrada silenciosamente
 * a USD: el precio queda explícitamente en actualización.
 */
export function formatProductPrice(priceUsd: number, gydPerUsd: number | null) {
  const usd = `US$ ${priceUsd.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (!gydPerUsd || gydPerUsd <= 0) return { primary: "Precio en actualización", secondary: null as string | null };
  const gyd = `G$ ${formatNumber(priceUsd * gydPerUsd)}`;
  return { primary: gyd, secondary: usd };
}

export function formatRateNatural(rate: number, currency: string) {
  if (!(rate > 0)) return "—";
  if (tasaSeLeeInvertida(rate)) {
    const porUnidad = gydPorUnidad(rate).toLocaleString("es", { maximumFractionDigits: 2 });
    return `${porUnidad} GYD = 1 ${currency}`;
  }
  return `1 GYD = ${formatRate(rate)} ${currency}`;
}
