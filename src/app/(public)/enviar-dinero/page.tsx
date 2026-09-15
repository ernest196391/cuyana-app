import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import UpdatedAtNote from "@/components/UpdatedAtNote";

export const metadata: Metadata = {
  title: "Enviar dinero",
  description: "Calcula cuánto recibe tu familia en Cuba y pide tu envío por WhatsApp.",
  alternates: { canonical: "/enviar-dinero" },
};

export default function EnviarDineroPage() {
  return (
    <div className="wrap page-section">
      {/* Sin lead. La calculadora que va debajo ya dice a cuánto está cada
          método; una frase encima explicando que existe una tasa solo separa
          el título de lo único que la persona vino a hacer. El aviso de tasa
          vieja sigue saliendo, y solo cuando lo hay. */}
      <h1 className="page-title page-title-centrado">Enviar dinero</h1>
      <p className="rate-freshness-linea">
        <UpdatedAtNote soloSiHayQueAvisar />
      </p>
      <div className="enviar-dinero-calc">
        <Calculator />
      </div>
    </div>
  );
}
