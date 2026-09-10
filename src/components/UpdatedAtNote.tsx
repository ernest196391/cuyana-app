"use client";

import { useDeliveryMethods } from "@/lib/useDeliveryMethods";
import Skeleton from "./Skeleton";

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Tasas actualizadas hoy, ${time}.`;
  const day = date.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
  return `Tasas actualizadas el ${day}, ${time}.`;
}

export default function UpdatedAtNote() {
  const { updatedAt, status } = useDeliveryMethods();

  if (status === "loading") return <Skeleton width="12em" />;
  if (status === "error" || !updatedAt) return <>Tasas actualizadas recientemente.</>;
  return <>{formatUpdatedAt(updatedAt)}</>;
}
