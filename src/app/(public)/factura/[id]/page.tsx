"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatFechaLegible, formatMoney, type InvoiceLineItem, type InvoiceParty } from "@/lib/invoice";
import { WHATSAPP_NUMBER } from "@/lib/config/site";

type InvoiceRow = {
  id: string;
  number: string | null;
  invoice_date: string;
  issuer: InvoiceParty;
  recipient: InvoiceParty;
  line_items: InvoiceLineItem[];
  total_amount: number;
  currency: string;
  payment_status: "pendiente" | "pagado";
  pdf_path: string | null;
};

export default function FacturaPublicaPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-existe">("cargando");

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.rpc("factura_publica", { p_id: params.id });
      if (!vivo) return;
      const found = (data as InvoiceRow | null) || null;
      if (!found) {
        setEstado("no-existe");
        return;
      }
      setInvoice(found);
      if (found.pdf_path) {
        const { data: signed } = await supabase.storage.from("cuyana-documentos").createSignedUrl(found.pdf_path, 60 * 60 * 24);
        if (vivo) setPdfUrl(signed?.signedUrl || null);
      }
      setEstado("listo");
    })();
    return () => { vivo = false; };
  }, [params.id]);

  if (estado === "cargando") {
    return (
      <div className="wrap page-section">
        <p className="page-lead">Buscando tu factura…</p>
      </div>
    );
  }

  if (estado === "no-existe" || !invoice) {
    return (
      <div className="wrap page-section cuenta-entrar">
        <h1 className="page-title">No encontramos esta factura</h1>
        <p className="page-lead">
          El enlace puede haber cambiado o la factura todavía no está lista. Escríbenos si crees que es un error.
        </p>
        <a className="cta" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="wrap page-section cuenta-entrar">
      <h1 className="page-title">Tu factura {invoice.number}</h1>
      <p className="page-lead">Fecha: {formatFechaLegible(invoice.invoice_date)}</p>

      <div className="comprobante">
        {invoice.line_items.map((item, i) => (
          <p className="comprobante-linea" key={i}>
            <span>{item.description}</span>
            <strong>{formatMoney(item.amount, invoice.currency)}</strong>
          </p>
        ))}
        <p className="comprobante-linea comprobante-destacado">
          <span>Total</span>
          <strong>{formatMoney(invoice.total_amount, invoice.currency)}</strong>
        </p>
        <p className="comprobante-linea">
          <span>Estado</span>
          <strong>{invoice.payment_status === "pagado" ? "Pagada" : "Pendiente de pago"}</strong>
        </p>
      </div>

      {pdfUrl && (
        <div className="comprobante-acciones">
          <a className="cta" href={pdfUrl} target="_blank" rel="noopener noreferrer">
            Descargar factura (PDF)
          </a>
        </div>
      )}
    </div>
  );
}
