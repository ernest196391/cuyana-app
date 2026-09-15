"use client";

import { useDeliveryMethods } from "@/lib/useDeliveryMethods";
import { useAppConfig } from "@/lib/useAppConfig";
import { rateFreshnessStatus, RATE_FRESHNESS_LABEL } from "@/lib/rateFreshness";
import Skeleton from "./Skeleton";

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `hoy, ${time}`;
  const day = date.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
  return `el ${day}, ${time}`;
}

export function useRateFreshness() {
  const { updatedAt, status } = useDeliveryMethods();
  const { get } = useAppConfig();
  const freshHours = Number(get("rate_fresh_hours", "12")) || 12;
  const staleHours = Number(get("rate_stale_hours", "24")) || 24;
  if (status !== "ready" || !updatedAt) return null;
  return rateFreshnessStatus(updatedAt, new Date(), freshHours, staleHours);
}

/**
 * @param soloSiHayQueAvisar  Con la tasa vigente, no pinta nada.
 *
 * «Tasa vigente · actualizada el 12/9, 21:31» solo dice que todo va bien, y
 * eso no hace falta decirlo: ocupa la línea de debajo del título y no cambia
 * ninguna decisión de quien la lee. Lo que sí hay que decir es lo contrario
 * —que la tasa se está quedando vieja—, y eso se sigue diciendo. Así que esto
 * no quita el aviso: quita el ruido y deja el aviso.
 */
export default function UpdatedAtNote({ soloSiHayQueAvisar = false }: { soloSiHayQueAvisar?: boolean } = {}) {
  const { updatedAt, status } = useDeliveryMethods();
  const freshness = useRateFreshness();

  if (status === "loading") return soloSiHayQueAvisar ? null : <Skeleton width="14em" />;
  if (status === "error" || !updatedAt) return <>No pudimos confirmar la vigencia de la tasa ahora mismo.</>;

  if (soloSiHayQueAvisar && freshness === "vigente") return null;

  const cuando = formatUpdatedAt(updatedAt);
  if (!freshness) return <>Tasas actualizadas {cuando}.</>;

  return (
    <span className={`rate-freshness rate-freshness-${freshness}`}>
      {RATE_FRESHNESS_LABEL[freshness]} · actualizada {cuando}
    </span>
  );
}
