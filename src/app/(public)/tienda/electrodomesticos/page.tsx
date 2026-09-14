import type { Metadata } from "next";
import CategoryPage from "@/components/store/CategoryPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Electrodomésticos",
  description: "Electrodomésticos para tu familia en Cuba, con precios en GYD y entrega coordinada por CUYANA.",
  alternates: { canonical: "/tienda/electrodomesticos" },
};

const RICE_COOKER_ORDER = [
  "arrocera-eko-18l",
  "arrocera-desmatt-kec-118-18l",
  "arrocera-maf-12l-vaporera",
  "arrocera-wealco-22l",
];

export default function ElectrodomesticosPage() {
  return (
    <CategoryPage
      category="electrodomesticos"
      title="Electrodomésticos para el hogar"
      lead="Equipos prácticos para tu familia en Cuba. Confirmamos disponibilidad antes de ejecutar la compra."
      orderedSlugs={RICE_COOKER_ORDER}
    />
  );
}
