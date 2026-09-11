import type { Metadata } from "next";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Ayuda",
  description: "Preguntas frecuentes sobre enviar dinero, alimentos y energía con Cuyana.",
  alternates: { canonical: "/ayuda" },
};

const PREGUNTAS = [
  {
    q: "¿Cómo envío dinero?",
    a: "Entra a Enviar dinero, escribe cuánto quieres mandar, elige el método y confirma tu envío por WhatsApp.",
  },
  {
    q: "¿La tasa que veo es la que se aplica?",
    a: "Sí, mientras esté marcada como vigente. Si aparece como vencida, confírmala con nosotros antes de continuar.",
  },
  {
    q: "¿Puedo pedir alimentos o energía ahora mismo?",
    a: "Si el catálogo todavía está en preparación, lo verás indicado en esa sección; puedes preguntar disponibilidad por WhatsApp.",
  },
  {
    q: "¿Cómo hago seguimiento de mi envío?",
    a: "Por el mismo WhatsApp donde confirmaste el envío.",
  },
];

export default function AyudaPage() {
  return (
    <div className="wrap page-section legal-page">
      <h1 className="page-title">Ayuda</h1>
      <dl className="faq-list">
        {PREGUNTAS.map((item) => (
          <div key={item.q} className="faq-item">
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
      <p className="page-lead">
        ¿No encuentras lo que buscas?{" "}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
          Escríbenos por WhatsApp
        </a>{" "}
        o revisa <Link href="/contacto">contacto</Link>.
      </p>
    </div>
  );
}
