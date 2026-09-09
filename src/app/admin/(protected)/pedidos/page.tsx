"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNumber } from "@/lib/format";
import { STATUS_OPTIONS, getStatusColor } from "@/lib/orderStatus";

interface OrderRow {
  id: number;
  amount_gyd: number;
  amount_cup: number;
  ref_code: string | null;
  status: string;
  created_at: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function load(currentFilter: string) {
    if (!supabase) return;
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("id, amount_gyd, amount_cup, ref_code, status, created_at")
      .order("created_at", { ascending: false });
    if (currentFilter !== "todos") query = query.eq("status", currentFilter);
    const { data, error } = await query;
    if (!error && data) setOrders(data as OrderRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
      ) : orders.length === 0 ? (
        <div className="admin-empty-state">
          <p>Todavía no hay pedidos{filter !== "todos" ? " con este estado" : ""}.</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-row admin-row-head">
            <div className="admin-cell">Fecha</div>
            <div className="admin-cell">GYD</div>
            <div className="admin-cell">CUP</div>
            <div className="admin-cell">Referido</div>
            <div className="admin-cell">Estado</div>
          </div>
          {orders.map((o) => (
            <div className="admin-row" key={o.id}>
              <div className="admin-cell">
                <span className="admin-cell-label">Fecha</span>
                <span>{formatDateTime(o.created_at)}</span>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">GYD</span>
                <span>{formatNumber(Number(o.amount_gyd))}</span>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">CUP</span>
                <span>{formatNumber(Number(o.amount_cup))}</span>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">Referido</span>
                <span>{o.ref_code || "—"}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
