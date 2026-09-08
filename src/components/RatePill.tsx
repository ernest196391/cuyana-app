"use client";

import { useLiveRate } from "@/lib/useLiveRate";

export default function RatePill() {
  const rate = useLiveRate();

  return (
    <div className="rate-pill">
      Tasa de hoy · 1 GYD ={" "}
      <b>{rate !== null ? rate.toLocaleString("es", { minimumFractionDigits: 2 }) : "—"}</b> CUP
    </div>
  );
}
