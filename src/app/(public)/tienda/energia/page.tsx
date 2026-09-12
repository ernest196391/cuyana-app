import type { Metadata } from "next";
import CategoryPage from "@/components/store/CategoryPage";

// El catálogo y la tasa comercial se leen en vivo (NEXO + Supabase): esta
// página nunca debe congelarse como HTML estático del momento del build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Energía",
  description: "Soluciones de energía solar para el hogar en Cuba.",
  alternates: { canonical: "/tienda/energia" },
};

export default function EnergiaPage() {
  return (
    <CategoryPage
      category="energia"
      title="Energía para el hogar"
      lead="Soluciones de energía solar reales, sin inventar disponibilidad."
    />
  );
}
