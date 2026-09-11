// Vigencia de tasas: pura por diseño para poder probarse sin red ni fechas
// reales del sistema. Sustituye el antiguo "tasa de hoy" fijo por un
// estado derivado de cuándo se actualizó de verdad.

export type RateFreshness = "vigente" | "por_vencer" | "vencida";

/**
 * @param updatedAtIso  updated_at de la tasa (ISO 8601).
 * @param now           instante de referencia (inyectable para pruebas).
 * @param freshHours    por debajo de esta antigüedad, "vigente".
 * @param staleHours    por encima de esta antigüedad, "vencida"; entre
 *                      freshHours y staleHours, "por_vencer".
 */
export function rateFreshnessStatus(
  updatedAtIso: string,
  now: Date,
  freshHours: number,
  staleHours: number
): RateFreshness {
  const ageMs = now.getTime() - new Date(updatedAtIso).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 0) return "vigente"; // reloj adelantado del cliente: no penalizar
  if (ageHours < freshHours) return "vigente";
  if (ageHours < staleHours) return "por_vencer";
  return "vencida";
}

export const RATE_FRESHNESS_LABEL: Record<RateFreshness, string> = {
  vigente: "Tasa vigente",
  por_vencer: "Tasa por vencer",
  vencida: "Tasa vencida — confírmala antes de continuar",
};
