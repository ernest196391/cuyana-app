import type { Metadata } from "next";
import { getStoreCommercialRate } from "@/lib/catalog/commercialRate";
import CarritoClient from "./CarritoClient";

// La tasa comercial se lee en vivo de Supabase: no se congela en el build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};

export default async function CarritoPage() {
  const rate = await getStoreCommercialRate();
  return <CarritoClient gydPerUsd={rate?.gydPerUsd ?? null} />;
}
