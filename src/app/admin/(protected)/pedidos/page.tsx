"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { conTimeout, mensajeDeError } from "@/lib/adminFetch";
import { formatDateTime, formatMoney, formatNumber, formatRateNatural } from "@/lib/format";
import { STATUS_OPTIONS, getStatusColor } from "@/lib/orderStatus";
import LoadError from "@/components/admin/LoadError";

interface OrderRow {
  id: number;
  amount_gyd: number;
  amount_cup: number;
  customer_name: string | null;
  customer_whatsapp: string | null;
  method_key: string | null;
  rate_used: number | null;
  ref_code: string | null;
  status: string;
  created_at: string;
}

interface MethodInfo {
  label: string;
  target_currency: string;
}

/** wa.me solo acepta dígitos; el cliente teclea el número como le sale. */
function waHref(numero: string) {
  return `https://wa.me/${numero.replace(/\D/g, "")}`;
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [methods, setMethods] = useState<Record<string, MethodInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("todos");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async (currentFilter: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!supabase) throw new Error("La conexión con la base de datos no está configurada.");
      let query = supabase
        .from("orders")
        .select(
          "id, amount_gyd, amount_cup, customer_name, customer_whatsapp, method_key, rate_used, ref_code, status, created_at"
        )
        .order("created_at", { ascending: false });
      if (currentFilter !== "todos") query = query.eq("status", currentFilter);

      const [oRes, mRes] = await Promise.all([
        conTimeout(query),
        conTimeout(supabase.from("delivery_methods").select("key, label, target_currency")),
      ]);
      if (oRes.error) throw oRes.error;
      if (mRes.error) throw mRes.error;

      const mapa: Record<string, MethodInfo> = {};
      for (const m of mRes.data ?? []) {
        mapa[m.key as string] = { label: m.label as string, target_currency: m.target_currency as string };
      }
      setMethods(mapa);
      setOrders((oRes.data ?? []) as OrderRow[]);
    } catch (err) {
      setLoadError(mensajeDeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function handleStatusChange(id: number, newStatus: string) {
    if (!supabase) return;
    setUpdatingId(id);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
    setUpdatingId(null);
  }

  return (
    <div className="admin-view">
      <h1 className="admin-title">Pedidos</h1>

      <div className="admin-filter-row">
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="admin-empty">Cargando…</p>
      ) : loadError ? (
        <LoadError que="los pedidos" detalle={loadError} onRetry={() => load(filter)} />
      ) : orders.length === 0 ? (
        <div className="admin-empty-state">
          <p>Todavía no hay pedidos{filter !== "todos" ? " con este estado" : ""}.</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-row admin-row-pedidos admin-row-head">
            <div className="admin-cell">Fecha</div>
            <div className="admin-cell">Cliente</div>
            <div className="admin-cell">Envía</div>
            <div className="admin-cell">Recibe</div>
            <div className="admin-cell">Método</div>
            <div className="admin-cell">Estado</div>
          </div>
          {orders.map((o) => {
            // Pedidos anteriores a los métodos múltiples no tienen method_key y
            // siempre fueron en CUP.
            const info = o.method_key ? methods[o.method_key] : undefined;
            const moneda = info?.target_currency ?? "CUP";
            return (
              <div className="admin-row admin-row-pedidos" key={o.id}>
                <div className="admin-cell">
                  <span className="admin-cell-label">Fecha</span>
                  <span>{formatDateTime(o.created_at)}</span>
                </div>

                <div className="admin-cell">
                  <span className="admin-cell-label">Cliente</span>
                  <span>{o.customer_name || "—"}</span>
                  {o.customer_whatsapp && (
                    <a
                      className="admin-wa-link"
                      href={waHref(o.customer_whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {o.customer_whatsapp}
                    </a>
                  )}
                </div>

                <div className="admin-cell">
                  <span className="admin-cell-label">Envía</span>
                  <span className="admin-mono">{formatNumber(Number(o.amount_gyd))} GYD</span>
                </div>

                <div className="admin-cell">
                  <span className="admin-cell-label">Recibe</span>
                  <span className="admin-mono">
                    {formatMoney(Number(o.amount_cup), moneda)} {moneda}
                  </span>
                </div>

                <div className="admin-cell">
                  <span className="admin-cell-label">Método</span>
                  <span>{info?.label ?? o.method_key ?? "—"}</span>
                  {o.rate_used != null && (
                    <span className="admin-subtext">{formatRateNatural(Number(o.rate_used), moneda)}</span>
                  )}
                  {o.ref_code && <span className="admin-subtext">Referido: {o.ref_code}</span>}
                </div>

                <div className="admin-cell">
                  <span className="admin-cell-label">Estado</span>
                  <select
                    className="admin-status-select"
                    style={{ color: getStatusColor(o.status), borderColor: getStatusColor(o.status) }}
                    value={o.status}
                    disabled={updatingId === o.id}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
