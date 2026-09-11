import type { Metadata } from "next";
import { WHATSAPP_NUMBER } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Cómo comunicarte con Cuyana.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <div className="wrap page-section legal-page">
      <h1 className="page-title">Contacto</h1>
      <p className="page-lead">
        El canal directo con Cuyana es WhatsApp: ahí confirmamos disponibilidad, precio y
        seguimiento de cada envío.
      </p>
      <a className="cta cta-inline" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
        Escribir por WhatsApp
      </a>
      <p className="legal-pending">
        Razón social, dirección y datos de contacto adicionales: pendientes de configuración por
        el negocio. Esta página se actualizará en cuanto estén confirmados — no se publican datos
        inventados.
      </p>
    </div>
  );
}
