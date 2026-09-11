import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos",
  description: "Condiciones de uso del servicio de Cuyana.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <div className="wrap page-section legal-page">
      <h1 className="page-title">Términos</h1>
      <p className="page-lead">
        Antes de confirmar un envío por WhatsApp, Cuyana te muestra el monto, el método y la tasa
        aplicable. El envío se confirma directamente contigo por ese canal.
      </p>
      <h2>Lo que sí podemos confirmar</h2>
      <p>
        La tasa y el método mostrados en la calculadora corresponden a la última actualización
        registrada, con su fecha visible. Los montos y métodos disponibles pueden cambiar sin
        previo aviso; el total que ves antes de continuar es el que aplica en ese momento.
      </p>
      <p className="legal-pending">
        Términos y condiciones legales completos (jurisdicción, resolución de disputas, límites
        de responsabilidad, plazos de entrega garantizados): pendientes de confirmación legal por
        el negocio. No se publican plazos, garantías ni condiciones no verificadas.
      </p>
    </div>
  );
}
