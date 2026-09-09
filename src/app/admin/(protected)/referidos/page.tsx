"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { formatPercent } from "@/lib/format";

interface ReferralRow {
  code: string;
  owner_name: string;
  commission_pct: number;
  active: boolean;
  created_at: string;
}

const SITE_URL = "https://cuyana.casavivadecuba.com";

export default function ReferidosPage() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [pct, setPct] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select("code, owner_name, commission_pct, active, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setReferrals(data as ReferralRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setFormError(null);
    const { error } = await supabase.from("referrals").insert({
      code: code.trim(),
      owner_name: ownerName.trim(),
      commission_pct: parseFloat(pct.replace(",", ".")) || 0,
    });
    setSaving(false);
    if (error) {
      setFormError(error.code === "23505" ? "Ese código ya existe." : "No se pudo crear: " + error.message);
      return;
    }
    setCode("");
    setOwnerName("");
    setPct("");
    setShowForm(false);
    load();
  }

  async function handleToggle(row: ReferralRow) {
    if (!supabase) return;
    setTogglingCode(row.code);
    const { error } = await supabase.from("referrals").update({ active: !row.active }).eq("code", row.code);
    if (!error) {
      setReferrals((prev) => prev.map((r) => (r.code === row.code ? { ...r, active: !r.active } : r)));
    }
    setTogglingCode(null);
  }

  async function handleCopy(refCode: string) {
    const link = `${SITE_URL}/?ref=${encodeURIComponent(refCode)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(refCode);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      // portapapeles no disponible; sin acción
    }
  }

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1 className="admin-title">Referidos</h1>
        <button className="admin-btn-primary" onClick={() => setShowForm((v) => !v)} type="button">
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {showForm && (
        <form className="admin-card admin-form" onSubmit={handleCreate}>
          <label className="admin-label" htmlFor="ref-code">
            Código
          </label>
          <input
            id="ref-code"
            className="admin-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />

          <label className="admin-label" htmlFor="ref-name">
            Nombre
          </label>
          <input id="ref-name" className="admin-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />

          <label className="admin-label" htmlFor="ref-pct">
            % Comisión
          </label>
          <input
            id="ref-pct"
            className="admin-input"
            inputMode="decimal"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="5"
            required
          />

          <button className="admin-btn-primary admin-btn-full" type="submit" disabled={saving}>
            {saving ? "Creando…" : "Crear referido"}
          </button>
          {formError && <p className="admin-error">{formError}</p>}
        </form>
      )}

      {loading ? (
        <p className="admin-empty">Cargando…</p>
      ) : referrals.length === 0 ? (
        <div className="admin-empty-state">
          <p>Todavía no hay referidos creados.</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-row admin-row-head">
            <div className="admin-cell">Código</div>
            <div className="admin-cell">Nombre</div>
            <div className="admin-cell">Comisión</div>
            <div className="admin-cell">Estado</div>
            <div className="admin-cell">Link</div>
          </div>
          {referrals.map((r) => (
            <div className="admin-row" key={r.code}>
              <div className="admin-cell">
                <span className="admin-cell-label">Código</span>
                <span className="admin-mono">{r.code}</span>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">Nombre</span>
                <span>{r.owner_name}</span>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">Comisión</span>
                <span>{formatPercent(Number(r.commission_pct))}%</span>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">Estado</span>
                <button
                  className={`admin-toggle${r.active ? " on" : ""}`}
                  onClick={() => handleToggle(r)}
                  disabled={togglingCode === r.code}
                  aria-pressed={r.active}
                  type="button"
                >
                  {r.active ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div className="admin-cell">
                <span className="admin-cell-label">Link</span>
                <button className="admin-copy-btn" onClick={() => handleCopy(r.code)} type="button">
                  {copiedCode === r.code ? "¡Copiado!" : "Copiar link"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
