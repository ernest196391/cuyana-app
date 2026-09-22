"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { conTimeout, mensajeDeError } from "@/lib/adminFetch";
import { formatMoney } from "@/lib/invoice";
import LoadError from "@/components/admin/LoadError";

type Invoice = {
  id: string;
  number: string | null;
  invoice_date: string;
  recipient: { name?: string };
  total_amount: number;
  currency: string;
  status: "borrador" | "emitida";
  payment_status: "pendiente" | "pagado";
  source_type: "pedido" | "captura" | "manual";
};

export default function FacturasPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loadError, setLoadError] = useState("");

  async function load() {
    if (!supabase) return;
    setLoadError("");
    try {
      const { data, error } = await conTimeout(supabase.rpc("admin_listar_facturas"));
      if (error) throw error;
      setInvoices((data as Invoice[]) ?? []);
    } catch (err) {
      setLoadError(mensajeDeError(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (invoices === null && !loadError) {
    return <main className="admin-page"><p>Cargando facturas…</p></main>;
  }
  if (loadError) {
    return <main className="admin-page"><LoadError que="las facturas" detalle={loadError} onRetry={load} /></main>;
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">FACTURACIÓN</p>
          <h1>Facturas</h1>
        </div>
        <div className="admin-catalogo-header-actions">
          <Link className="admin-btn-secondary" href="/admin/facturas/perfil">
            Perfil del negocio
          </Link>
          <Link className="admin-btn-primary" href="/admin/facturas/nueva">
            + Nueva factura
          </Link>
        </div>
      </header>

      <div className="admin-table">
        <div className="admin-row admin-row-head admin-row-facturas">
          <span>Número</span>
          <span>Cliente</span>
          <span>Total</span>
          <span>Origen</span>
          <span>Estado</span>
          <span>Pago</span>
          <span></span>
        </div>
        {invoices?.map((inv) => (
          <div className="admin-row admin-row-facturas" key={inv.id}>
            <span className="admin-cell">{inv.number || <span className="admin-note">Sin número</span>}</span>
            <span className="admin-cell">
              <span className="admin-cell-label">Cliente</span>
              {inv.recipient?.name || <span className="admin-note">Sin nombre</span>}
            </span>
            <span className="admin-cell">
              <span className="admin-cell-label">Total</span>
              {formatMoney(inv.total_amount, inv.currency)}
            </span>
            <span className="admin-cell">
              <span className="admin-cell-label">Origen</span>
              {inv.source_type === "pedido" ? "Pedido" : inv.source_type === "captura" ? "Captura" : "Manual"}
            </span>
            <span className="admin-cell">
              <span className={`admin-pill ${inv.status}`}>{inv.status === "emitida" ? "Emitida" : "Borrador"}</span>
            </span>
            <span className="admin-cell">
              <span className={`admin-pill ${inv.payment_status}`}>{inv.payment_status === "pagado" ? "Pagado" : "Pendiente"}</span>
            </span>
            <span className="admin-cell">
              <Link className="admin-text-link" href={`/admin/facturas/nueva?factura=${inv.id}`}>
                {inv.status === "emitida" ? "Ver / editar →" : "Revisar →"}
              </Link>
            </span>
          </div>
        ))}
        {invoices?.length === 0 && <div className="admin-empty-state">Todavía no se ha generado ninguna factura.</div>}
      </div>
    </main>
  );
}
