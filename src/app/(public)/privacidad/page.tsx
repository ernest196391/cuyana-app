import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos recoge Cuyana y para qué se usan.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="wrap page-section legal-page">
      <h1 className="page-title">Privacidad</h1>
      <p className="page-lead">
        Para calcular y confirmar un envío, Cuyana pide tu nombre y tu número de WhatsApp. Esa
        información se usa únicamente para procesar tu solicitud y contactarte sobre ella.
      </p>
      <h2>Qué datos guardamos</h2>
      <p>
        Nombre, número de WhatsApp, el monto y el método elegido de cada solicitud de envío que
        confirmas por WhatsApp. No guardamos datos de pago: los pagos se coordinan directamente
        por WhatsApp.
      </p>
      <h2>Con quién se comparten</h2>
      <p>
        No se venden ni se comparten con terceros con fines de publicidad. Se usan internamente
        para dar seguimiento a tu envío.
      </p>
      <p className="legal-pending">
        Política de privacidad completa (base legal detallada, plazos de retención, derechos
        ARCO/RGPD según jurisdicción aplicable): pendiente de confirmación legal por el negocio.
        No se publican plazos ni garantías que no estén verificados.
      </p>
    </div>
  );
}
