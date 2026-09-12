import type { Metadata } from "next";
import CategoryPage from "@/components/store/CategoryPage";

// Mismo motivo que /tienda/energia: catálogo y tasa comercial en vivo, sin
// congelar la página como HTML estático del momento del build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alimentos",
  description: "Combos de alimentos para enviar a tu familia en Cuba.",
  alternates: { canonical: "/tienda/alimentos" },
};

export default function AlimentosPage() {
  return (
    <CategoryPage
      category="alimentos"
      title="Alimentos para compartir en familia"
      lead="Combos de alimentos pensados para llegar a tu familia en Cuba."
    />
  );
}
