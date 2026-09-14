import type { Metadata } from "next";
import CategoryPage from "@/components/store/CategoryPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Electrodomésticos",
  description: "Electrodomésticos para tu familia en Cuba, con precios en GYD y entrega coordinada por CUYANA.",
  alternates: { canonical: "/tienda/electrodomesticos" },
};

export default function ElectrodomesticosPage() {
  return (
    <CategoryPage
      category="electrodomesticos"
      title="Electrodomésticos para el hogar"
      lead="Equipos prácticos para tu familia en Cuba. Confirmamos disponibilidad antes de ejecutar la compra."
    />
  );
}
