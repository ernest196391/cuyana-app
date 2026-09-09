"use client";

import { useLiveRate } from "@/lib/useLiveRate";
import { formatDecimal } from "@/lib/format";
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
        <b>{rate !== null ? formatDecimal(rate) : "—"}</b>
      )}{" "}
      CUP
    </div>
  );
}
