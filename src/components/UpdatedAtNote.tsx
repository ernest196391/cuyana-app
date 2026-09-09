"use client";

import { useLiveRate } from "@/lib/useLiveRate";
import Skeleton from "./Skeleton";

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Tasa actualizada hoy, ${time}.`;
  const day = date.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
  return `Tasa actualizada el ${day}, ${time}.`;
}

export default function UpdatedAtNote() {
  const { updatedAt, status } = useLiveRate();

  if (status === "loading") return <Skeleton width="12em" />;
  if (status === "error" || !updatedAt) return <>Tasa actualizada recientemente.</>;
  return <>{formatUpdatedAt(updatedAt)}</>;
}
