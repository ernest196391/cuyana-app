import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Elige alimentos o energía para enviar a tu familia en Cuba.",
  alternates: { canonical: "/tienda" },
};

export default function TiendaPage() {
  return (
    <div className="wrap page-section">
      <h1 className="page-title">Tienda Cuyana</h1>
      {/* La cobertura se dice aquí, en la puerta, y no al final del carrito.
          Enterarse de que no llega a tu provincia después de haberlo elegido
          todo es la peor forma de enterarse. Ojo: esto es solo la TIENDA — las
          remesas sí llegan a toda Cuba, y las dos coberturas no se mezclan. */}
      <p className="page-lead">
        Elige qué quieres enviar a tu familia en Cuba. Entregamos en La Habana.
      </p>
      <div className="need-grid need-grid-store">
        <Link href="/tienda/alimentos" className="need-card">
          <span className="need-title">Alimentos</span>
          <span className="need-desc">Combos de alimentos para compartir en familia.</span>
        </Link>
        <Link href="/tienda/energia" className="need-card">
          <span className="need-title">Energía</span>
          <span className="need-desc">Soluciones de energía solar para el hogar.</span>
        </Link>
      </div>
    </div>
  );
}
