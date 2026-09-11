import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estado de tu pedido",
  robots: { index: false, follow: false },
};

/**
 * Seguimiento de pedidos de tienda. Mientras no exista integración real de
 * pedidos con el sistema canónico (ver src/lib/catalog), no hay ningún
 * pedido de tienda que buscar: se dice así en vez de simular uno.
 */
export default function PedidoPage({ params }: { params: { codigo: string } }) {
  return (
    <div className="wrap page-section">
      <h1 className="page-title">Pedido {params.codigo}</h1>
      <div className="catalog-empty">
        <h2>El seguimiento de pedidos de tienda todavía no está disponible</h2>
        <p>
          La tienda Cuyana está en preparación: los pedidos de alimentos y energía se confirman
          por WhatsApp mientras conectamos el sistema de pedidos. Si enviaste una remesa, ese
          seguimiento se hace directamente por WhatsApp con quien te atendió.
        </p>
      </div>
    </div>
  );
}
