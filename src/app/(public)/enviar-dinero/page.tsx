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
      <h1 className="page-title">Enviar dinero</h1>
      <p className="page-lead">
        <UpdatedAtNote />
      </p>
      <div className="enviar-dinero-calc">
        <Calculator />
      </div>
    </div>
  );
}
