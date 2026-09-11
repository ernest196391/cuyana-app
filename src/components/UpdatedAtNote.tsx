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

export default function UpdatedAtNote() {
  const { updatedAt, status } = useDeliveryMethods();
  const freshness = useRateFreshness();

  if (status === "loading") return <Skeleton width="14em" />;
  if (status === "error" || !updatedAt) return <>No pudimos confirmar la vigencia de la tasa ahora mismo.</>;

  const cuando = formatUpdatedAt(updatedAt);
  if (!freshness) return <>Tasas actualizadas {cuando}.</>;

  return (
    <span className={`rate-freshness rate-freshness-${freshness}`}>
      {RATE_FRESHNESS_LABEL[freshness]} · actualizada {cuando}
    </span>
  );
}
