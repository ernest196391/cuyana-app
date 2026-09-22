"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { conTimeout, mensajeDeError } from "@/lib/adminFetch";
import LoadError from "@/components/admin/LoadError";

type Perfil = {
  legal_name: string;
  address_line: string;
  postal_city: string;
  phone: string;
  email: string;
  tax_note: string;
  iban: string;
  bic: string;
  bank_name: string;
  payment_reference_default: string;
  default_legal_notice: string;
  default_shipping_notice: string;
};

const VACIO: Perfil = {
  legal_name: "", address_line: "", postal_city: "", phone: "", email: "", tax_note: "",
  iban: "", bic: "", bank_name: "", payment_reference_default: "", default_legal_notice: "", default_shipping_notice: "",
};

export default function PerfilNegocioPage() {
  const [perfil, setPerfil] = useState<Perfil>(VACIO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!supabase) return;
    setLoadError("");
    try {
      const { data, error } = await conTimeout(supabase.rpc("admin_obtener_perfil_negocio"));
      if (error) throw error;
      if (data) setPerfil(data as Perfil);
    } catch (err) {
      setLoadError(mensajeDeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function set<K extends keyof Perfil>(key: K, value: string) {
    setPerfil((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function guardar() {
    if (!supabase) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.rpc("admin_actualizar_perfil_negocio", {
      p_legal_name: perfil.legal_name,
      p_address_line: perfil.address_line,
      p_postal_city: perfil.postal_city,
      p_phone: perfil.phone,
      p_email: perfil.email,
      p_tax_note: perfil.tax_note,
      p_iban: perfil.iban,
      p_bic: perfil.bic,
      p_bank_name: perfil.bank_name,
      p_payment_reference_default: perfil.payment_reference_default,
      p_default_legal_notice: perfil.default_legal_notice,
      p_default_shipping_notice: perfil.default_shipping_notice,
    });
    setSaving(false);
    if (err) setError(mensajeDeError(err));
    else setSaved(true);
  }

  if (loading) return <main className="admin-page"><p>Cargando perfil…</p></main>;
  if (loadError) return <main className="admin-page"><LoadError que="el perfil del negocio" detalle={loadError} onRetry={load} /></main>;

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">FACTURACIÓN</p>
          <h1>Perfil del negocio</h1>
          <p>Estos datos salen en cada factura (de quién es, cómo pagarte). Puedes dejarlos incompletos y rellenarlos cuando los tengas.</p>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <section className="admin-card">
        <h2>Identidad</h2>
        <label className="admin-label">Nombre / razón social
          <input className="admin-input" value={perfil.legal_name} onChange={(e) => set("legal_name", e.target.value)} />
        </label>
        <label className="admin-label">Dirección
          <input className="admin-input" value={perfil.address_line} onChange={(e) => set("address_line", e.target.value)} />
        </label>
        <label className="admin-label">Ciudad / código postal
          <input className="admin-input" value={perfil.postal_city} onChange={(e) => set("postal_city", e.target.value)} />
        </label>
        <label className="admin-label">Teléfono
          <input className="admin-input" value={perfil.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label className="admin-label">Correo
          <input className="admin-input" value={perfil.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="admin-label">Nota fiscal (opcional)
          <input className="admin-input" value={perfil.tax_note} onChange={(e) => set("tax_note", e.target.value)} />
        </label>
      </section>

      <section className="admin-card">
        <h2>Datos de pago por defecto</h2>
        <label className="admin-label">IBAN
          <input className="admin-input" value={perfil.iban} onChange={(e) => set("iban", e.target.value)} />
        </label>
        <label className="admin-label">BIC
          <input className="admin-input" value={perfil.bic} onChange={(e) => set("bic", e.target.value)} />
        </label>
        <label className="admin-label">Banco
          <input className="admin-input" value={perfil.bank_name} onChange={(e) => set("bank_name", e.target.value)} />
        </label>
        <label className="admin-label">Referencia de pago por defecto
          <input className="admin-input" value={perfil.payment_reference_default} onChange={(e) => set("payment_reference_default", e.target.value)} />
        </label>
      </section>

      <section className="admin-card">
        <h2>Textos por defecto</h2>
        <label className="admin-label">Nota legal
          <textarea className="admin-input" value={perfil.default_legal_notice} onChange={(e) => set("default_legal_notice", e.target.value)} />
        </label>
        <label className="admin-label">Nota de entrega
          <textarea className="admin-input" value={perfil.default_shipping_notice} onChange={(e) => set("default_shipping_notice", e.target.value)} />
        </label>
      </section>

      <div className="admin-product-publish-bar">
        <button type="button" className="admin-btn-primary admin-btn-full" onClick={guardar} disabled={saving}>
          {saving ? "Guardando…" : "Guardar perfil"}
        </button>
        {saved && <p className="admin-saved">Perfil guardado.</p>}
      </div>
    </main>
  );
}
