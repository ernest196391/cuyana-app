"use client";

import { useLiveRate } from "@/lib/useLiveRate";
import Skeleton from "./Skeleton";

export default function RatePill() {
  const { rate, status } = useLiveRate();

  return (
    <div className="rate-pill">
      <span className="rate-pill-prefix">Tasa de hoy · </span>
      1 GYD ={" "}
      {status === "loading" ? (
        <Skeleton width="3.4em" />
      ) : (
        <b>{rate !== null ? rate.toLocaleString("es", { minimumFractionDigits: 2 }) : "—"}</b>
      )}{" "}
      CUP
    </div>
  );
}
