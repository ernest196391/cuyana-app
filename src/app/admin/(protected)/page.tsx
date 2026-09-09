"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDecimal, parseDecimal } from "@/lib/format";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface RateRow {
  rate_gyd_to_cup: number;
  updated_by: string | null;
  updated_at: string;
}

interface HistoryRow {
  id: number;
  rate_gyd_to_cup: number;
  updated_by: string | null;
  created_at: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TasaPage() {
  const [current, setCurrent] = useState<RateRow | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [rateRes, histRes] = await Promise.all([
      supabase.from("rate_config").select("rate_gyd_to_cup, updated_by, updated_at").eq("id", 1).single(),
      supabase
        .from("rate_history")
        .select("id, rate_gyd_to_cup, updated_by, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    if (!rateRes.error && rateRes.data) setCurrent(rateRes.data as RateRow);
    if (!histRes.error && histRes.data) setHistory(histRes.data as HistoryRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const newRate = parseDecimal(input);
  const canSave = newRate > 0 && !saving;

  async function handleConfirm() {
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { error: rpcErr } = await supabase.rpc("admin_update_rate", { new_rate: newRate });
    setSaving(false);
    setConfirmOpen(false);
    if (rpcErr) {
      setError("No se pudo guardar la tasa: " + rpcErr.message);
      return;
    }
    setInput("");
    load();
  }

  return (
    <div className="admin-view">
      <h1 className="admin-title">Tasa del día</h1>

      <div className="admin-card">
        <span className="admin-label">Tasa actual</span>
        {loading ? (
          <div className="admin-skeleton-line" style={{ width: "8em" }} />
        ) : (
          <div className="admin-rate-value">
            {current ? formatDecimal(Number(current.rate_gyd_to_cup)) : "—"}{" "}
            <span className="admin-rate-unit">CUP</span>
          </div>
        )}
        {!loading && (
          <span className="admin-meta">
            {current?.updated_at ? `Actualizada ${formatDateTime(current.updated_at)}` : "Sin registro"}
            {current?.updated_by ? ` · ${current.updated_by}` : ""}
          </span>
        )}
      </div>

      <div className="admin-card admin-form">
        <label className="admin-label" htmlFor="new-rate">
          Nueva tasa (1 GYD = ? CUP)
        </label>
        <input
          id="new-rate"
          className="admin-input"
          type="text"
          inputMode="decimal"
          placeholder="21,40"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="admin-btn-primary admin-btn-full"
          disabled={!canSave}
          onClick={() => setConfirmOpen(true)}
          type="button"
        >
          Guardar nueva tasa
        </button>
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-card">
        <span className="admin-label">Últimos cambios</span>
        {!loading && history.length === 0 ? (
          <p className="admin-empty">Todavía no hay historial de cambios.</p>
        ) : (
          <ul className="admin-history-list">
            {history.map((h) => (
              <li key={h.id}>
                <span className="admin-history-rate">{formatDecimal(Number(h.rate_gyd_to_cup))} CUP</span>
                <span className="admin-history-meta">
                  {formatDateTime(h.created_at)}
                  {h.updated_by ? ` · ${h.updated_by}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar nueva tasa"
        message={`¿Confirmas cambiar la tasa de ${
          current ? formatDecimal(Number(current.rate_gyd_to_cup)) : "—"
        } a ${formatDecimal(newRate)} CUP? Este valor afecta cuánto reciben los clientes ahora mismo.`}
        confirmLabel={saving ? "Guardando…" : "Sí, guardar"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
