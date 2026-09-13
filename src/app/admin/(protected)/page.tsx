"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/useAdminAuth";
import { conTimeout, mensajeDeError } from "@/lib/adminFetch";
import { formatDateTime, formatRateNatural } from "@/lib/format";
import { slugifyUnico } from "@/lib/slug";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import LoadError from "@/components/admin/LoadError";
import RateInput, {
  direccionSugerida,
  tasaDesdeTexto,
  type Direccion,
} from "@/components/admin/RateInput";

interface MethodRow {
  id: number;
  key: string;
  label: string;
  target_currency: string;
  rate_per_gyd: number;
  note: string | null;
  active: boolean;
  sort_order: number;
  updated_by: string | null;
  updated_at: string;
}

interface HistoryRow {
  id: number;
  method_key: string;
  rate_per_gyd: number;
  updated_by: string | null;
  created_at: string;
}

export default function MetodosPage() {
  const { user } = useAdminAuth();

  const [methods, setMethods] = useState<MethodRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // edición de tasa
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [rateText, setRateText] = useState("");
  const [direccion, setDireccion] = useState<Direccion>("directa");
  const [confirmarTasa, setConfirmarTasa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // alta de método
  const [showForm, setShowForm] = useState(false);
  const [nLabel, setNLabel] = useState("");
  const [nCurrency, setNCurrency] = useState("");
  const [nRate, setNRate] = useState("");
  const [nDireccion, setNDireccion] = useState<Direccion>("directa");
  const [nNote, setNNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // activar / desactivar
  const [confirmarBaja, setConfirmarBaja] = useState<MethodRow | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!supabase) throw new Error("La conexión con la base de datos no está configurada.");
      const [mRes, hRes] = await Promise.all([
        conTimeout(
          supabase
            .from("delivery_methods")
            .select("id, key, label, target_currency, rate_per_gyd, note, active, sort_order, updated_by, updated_at")
            .order("sort_order", { ascending: true })
        ),
        conTimeout(
          supabase
            .from("rate_method_history")
            .select("id, method_key, rate_per_gyd, updated_by, created_at")
            .order("created_at", { ascending: false })
            .limit(10)
        ),
      ]);
      if (mRes.error) throw mRes.error;
      if (hRes.error) throw hRes.error;
      setMethods((mRes.data ?? []) as MethodRow[]);
      setHistory((hRes.data ?? []) as HistoryRow[]);
    } catch (err) {
      setLoadError(mensajeDeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const editando = methods.find((m) => m.key === editingKey) ?? null;
  const nuevaTasa = tasaDesdeTexto(rateText, direccion);

  function abrirEdicion(m: MethodRow) {
    setActionError(null);
    setEditingKey(m.key);
    // Campo vacío a propósito: si apareciera la tasa vigente escrita, bastaría
    // con no tocarla para "guardar" un cambio que nadie decidió.
    setRateText("");
    setDireccion(direccionSugerida(Number(m.rate_per_gyd)));
  }

  async function guardarTasa() {
    if (!supabase || !editando) return;
    setSaving(true);
    setActionError(null);
    const { error } = await supabase.rpc("admin_update_method_rate", {
      p_key: editando.key,
      p_rate: nuevaTasa,
    });
    setSaving(false);
    setConfirmarTasa(false);
    if (error) {
      setActionError("No se pudo guardar la tasa: " + error.message);
      return;
    }
    setEditingKey(null);
    setRateText("");
    load();
  }

  const keysUsados = methods.map((m) => m.key);
  const nKey = slugifyUnico(nLabel, keysUsados);
  const nTasa = tasaDesdeTexto(nRate, nDireccion);
  const nMoneda = nCurrency.trim().toUpperCase();
  const puedeCrear = nKey !== "" && nMoneda !== "" && nTasa > 0 && !creating;

  async function crearMetodo(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !puedeCrear) return;
    setCreating(true);
    setFormError(null);

    const email = user?.email ?? null;
    const siguienteOrden = methods.reduce((max, m) => Math.max(max, m.sort_order), 0) + 1;

    const { error } = await supabase.from("delivery_methods").insert({
      key: nKey,
      label: nLabel.trim(),
      target_currency: nMoneda,
      rate_per_gyd: nTasa,
      note: nNote.trim() || null,
      active: true,
      sort_order: siguienteOrden,
      updated_by: email,
    });

    if (error) {
      setCreating(false);
      setFormError(
        error.code === "23505" ? "Ya existe un método con ese identificador." : "No se pudo crear: " + error.message
      );
      return;
    }

    // La tasa de arranque también queda auditada: el historial no debería
    // empezar en el primer cambio, sino en el primer valor.
    const { error: histErr } = await supabase.from("rate_method_history").insert({
      method_key: nKey,
      rate_per_gyd: nTasa,
      updated_by: email,
    });
    setCreating(false);

    if (histErr) {
      setFormError("El método se creó, pero su tasa inicial no quedó en el historial: " + histErr.message);
    } else {
      setShowForm(false);
      setFormError(null);
    }

    setNLabel("");
    setNCurrency("");
    setNRate("");
    setNNote("");
    load();
  }

  async function aplicarToggle(m: MethodRow) {
    if (!supabase) return;
    setTogglingKey(m.key);
    setActionError(null);
    const { error } = await supabase
      .from("delivery_methods")
      .update({ active: !m.active, updated_by: user?.email ?? null, updated_at: new Date().toISOString() })
      .eq("key", m.key);
    setTogglingKey(null);
    setConfirmarBaja(null);
    if (error) {
      setActionError("No se pudo cambiar el estado: " + error.message);
      return;
    }
    setMethods((prev) => prev.map((x) => (x.key === m.key ? { ...x, active: !x.active } : x)));
  }

  function onToggle(m: MethodRow) {
    // Desactivar lo saca de la landing en el acto; activar no le quita nada a
    // nadie. Solo se confirma la dirección que el cliente nota.
    if (m.active) setConfirmarBaja(m);
    else aplicarToggle(m);
  }

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1 className="admin-title">Métodos y tasas</h1>
      </div>

      {/* Las tasas se cambian en UN solo sitio. Antes vivían aquí y en Cuadre a
          la vez, coincidiendo por costumbre: el día que se separaran, el cliente
          pediría a un precio y Cuadre registraría otro. Ahora esta pantalla es
          el reflejo, y la propia base rechaza cualquier cambio que no venga de
          Cuadre — así que dejar los botones puestos solo serviría para que
          alguien se llevara un error. */}
      <div className="admin-card admin-solo-lectura">
        <p>
          <strong>Las tasas se cambian en Cuadre.</strong> Esta pantalla enseña lo que hay puesto
          ahora mismo en la web, y se actualiza sola en cuanto cambias algo allá.
        </p>
        <a
          className="admin-btn-primary"
          href="https://cuadre.casavivadecuba.com/metodos"
          target="_blank"
          rel="noopener"
        >
          Abrir Tasas en Cuadre
        </a>
      </div>

      {showForm && (
        <form className="admin-card admin-form" onSubmit={crearMetodo}>
          <label className="admin-label" htmlFor="m-label">
            Cómo lo ve el cliente
          </label>
          <input
            id="m-label"
            className="admin-input"
            value={nLabel}
            onChange={(e) => setNLabel(e.target.value)}
            required
          />
          <p className="admin-hint">
            Identificador interno: <span className="admin-mono">{nKey || "—"}</span> (se genera solo)
          </p>

          <label className="admin-label" htmlFor="m-cur">
            Moneda que recibe
          </label>
          <input
            id="m-cur"
            className="admin-input"
            value={nCurrency}
            maxLength={5}
            onChange={(e) => setNCurrency(e.target.value.toUpperCase())}
            required
          />

          <label className="admin-label">Tasa</label>
          <RateInput
            id="m-rate"
            currency={nMoneda}
            valor={nRate}
            onValor={setNRate}
            direccion={nDireccion}
            onDireccion={setNDireccion}
          />

          <label className="admin-label" htmlFor="m-note">
            Nota para el cliente (opcional)
          </label>
          <input id="m-note" className="admin-input" value={nNote} onChange={(e) => setNNote(e.target.value)} />

          <button className="admin-btn-primary admin-btn-full" type="submit" disabled={!puedeCrear}>
            {creating ? "Creando…" : "Crear método"}
          </button>
          {formError && <p className="admin-error">{formError}</p>}
        </form>
      )}

      {loading ? (
        <div className="admin-card">
          <div className="admin-skeleton-line" style={{ width: "60%" }} />
        </div>
      ) : loadError ? (
        <LoadError que="los métodos de entrega" detalle={loadError} onRetry={load} />
      ) : methods.length === 0 ? (
        <div className="admin-empty-state">
          <p>Todavía no hay métodos de entrega.</p>
        </div>
      ) : (
        methods.map((m) => {
          const tasa = Number(m.rate_per_gyd);
          const abierto = editingKey === m.key;
          return (
            <div className={`admin-method${m.active ? "" : " inactivo"}`} key={m.key}>
              <div className="admin-method-head">
                <div className="admin-method-id">
                  <span className="admin-method-label">{m.label}</span>
                  <span className="admin-mono admin-method-key">{m.key}</span>
                </div>
                {/* Se ve, pero no se toca: activar o desactivar un método
                    también es escribir en el reflejo. Se hace en Cuadre. */}
                <span className={`admin-toggle${m.active ? " on" : ""}`} aria-hidden="false">
                  {m.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="admin-method-rate">{formatRateNatural(tasa, m.target_currency)}</div>
              {m.note && <p className="admin-method-note">{m.note}</p>}
              <span className="admin-meta">
                Actualizada {formatDateTime(m.updated_at)}
                {m.updated_by ? ` · ${m.updated_by}` : ""}
              </span>


            </div>
          );
        })
      )}

      {actionError && <p className="admin-error">{actionError}</p>}

      {!loading && !loadError && (
        <div className="admin-card">
          <span className="admin-label">Últimos cambios de tasa</span>
          {history.length === 0 ? (
            <p className="admin-empty">Todavía no hay historial de cambios.</p>
          ) : (
            <ul className="admin-history-list">
              {history.map((h) => {
                const metodo = methods.find((m) => m.key === h.method_key);
                return (
                  <li key={h.id}>
                    <span className="admin-history-rate">
                      {formatRateNatural(Number(h.rate_per_gyd), metodo?.target_currency ?? "")}
                    </span>
                    <span className="admin-history-meta">
                      {metodo?.label ?? h.method_key}
                      <br />
                      {formatDateTime(h.created_at)}
                      {h.updated_by ? ` · ${h.updated_by}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmarTasa && editando !== null}
        title="Confirmar nueva tasa"
        message={
          editando
            ? `¿Cambiar «${editando.label}» de ${formatRateNatural(
                Number(editando.rate_per_gyd),
                editando.target_currency
              )} a ${formatRateNatural(nuevaTasa, editando.target_currency)}? ` +
              "Esto afecta lo que reciben los clientes ahora mismo."
            : ""
        }
        confirmLabel={saving ? "Guardando…" : "Sí, guardar"}
        onConfirm={guardarTasa}
        onCancel={() => setConfirmarTasa(false)}
      />

      <ConfirmDialog
        open={confirmarBaja !== null}
        title="Desactivar método"
        message={
          confirmarBaja
            ? `«${confirmarBaja.label}» dejará de aparecer en la página para los clientes. ` +
              "No se borra nada: puedes volver a activarlo cuando quieras."
            : ""
        }
        confirmLabel={togglingKey ? "Desactivando…" : "Sí, desactivar"}
        onConfirm={() => confirmarBaja && aplicarToggle(confirmarBaja)}
        onCancel={() => setConfirmarBaja(null)}
      />
    </div>
  );
}
