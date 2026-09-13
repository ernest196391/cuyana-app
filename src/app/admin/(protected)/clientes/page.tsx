"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ETIQUETA_NIVEL, type Nivel } from "@/lib/cuenta";

/**
 * Los clientes, y la decisión de verificarlos.
 *
 * Aquí es donde una persona mira un carnet y decide. Esa decisión no la puede
 * tomar la app: verificar a alguien es el paso previo a entregarle dinero a su
 * familia antes de que él pague, y eso lo responde Adonys con su bolsillo.
 *
 * El carnet se abre con un botón, nunca al cargar la pantalla, y cada vez que
 * se abre queda escrito quién lo hizo.
 */

interface Cliente {
  id: string;
  full_name: string | null;
  phone: string | null;
  nivel: Nivel;
  motivo_rechazo: string | null;
  credito_usd: number;
  created_at: string;
  revisado_por: string | null;
  revisado_en: string | null;
}

interface Documento {
  id: string;
  tipo: string;
  subido_en: string;
}

interface Beneficiario {
  id: string;
  full_name: string;
  phone: string | null;
  provincia: string;
  municipio: string | null;
  zona: string | null;
  direccion: string | null;
  referencia: string | null;
}

const ORDEN: Nivel[] = ["en_revision", "verificado", "confianza", "sin_verificar", "rechazado"];

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, Documento[]>>({});
  const [benes, setBenes] = useState<Record<string, Beneficiario[]>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [credito, setCredito] = useState("");

  const cargar = useCallback(async () => {
    if (!supabase) return;
    setCargando(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("customer_profiles")
      .select("id, full_name, phone, nivel, motivo_rechazo, credito_usd, created_at, revisado_por, revisado_en")
      .order("created_at", { ascending: false });
    if (err) setError("No se pudieron cargar los clientes. " + err.message);
    setClientes((data ?? []) as Cliente[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Lo de cada cliente se pide al abrirlo, no para toda la lista de golpe. */
  async function abrir(id: string) {
    if (abierto === id) {
      setAbierto(null);
      return;
    }
    setAbierto(id);
    setMotivo("");
    setCredito("");
    if (!supabase || docs[id]) return;
    const [d, b] = await Promise.all([
      supabase.from("customer_documents").select("id, tipo, subido_en").eq("customer_id", id),
      supabase
        .from("customer_beneficiaries")
        .select("id, full_name, phone, provincia, municipio, zona, direccion, referencia")
        .eq("customer_id", id),
    ]);
    setDocs((m) => ({ ...m, [id]: (d.data ?? []) as Documento[] }));
    setBenes((m) => ({ ...m, [id]: (b.data ?? []) as Beneficiario[] }));
  }

  /** Abre el carnet en otra pestaña. El enlace dura un minuto y queda escrito. */
  async function verDocumento(documentId: string) {
    if (!supabase) return;
    setOcupado(documentId);
    setError(null);
    try {
      const { data: sesion } = await supabase.auth.getSession();
      const r = await fetch("/api/admin/documento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sesion.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ documentId }),
      });
      const cuerpo = await r.json();
      if (!r.ok) throw new Error(cuerpo.error ?? "No se pudo abrir.");
      window.open(cuerpo.url, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el documento.");
    } finally {
      setOcupado(null);
    }
  }

  async function mover(c: Cliente, nivel: Nivel, extra: Record<string, unknown> = {}) {
    if (!supabase) return;
    setOcupado(c.id);
    setError(null);
    const { data: sesion } = await supabase.auth.getSession();
    const { error: err } = await supabase
      .from("customer_profiles")
      .update({
        nivel,
        revisado_por: sesion.session?.user.email ?? null,
        revisado_en: new Date().toISOString(),
        ...extra,
      })
      .eq("id", c.id);
    setOcupado(null);
    if (err) {
      setError("No se pudo guardar. " + err.message);
      return;
    }
    setMotivo("");
    cargar();
  }

  async function darCredito(c: Cliente) {
    const monto = Number(credito.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(monto) || monto < 0) {
      setError("Escribe cuánto se le puede adelantar, en USD.");
      return;
    }
    if (!supabase) return;
    setOcupado(c.id);
    setError(null);
    const { data: sesion } = await supabase.auth.getSession();
    const { error: err } = await supabase
      .from("customer_profiles")
      .update({
        nivel: monto > 0 ? "confianza" : "verificado",
        credito_usd: monto,
        credito_por: sesion.session?.user.email ?? null,
        credito_en: new Date().toISOString(),
      })
      .eq("id", c.id);
    setOcupado(null);
    if (err) {
      setError("No se pudo guardar. " + err.message);
      return;
    }
    setCredito("");
    cargar();
  }

  // Los que esperan revisión, primero: es lo único que tiene una persona
  // esperando al otro lado.
  const ordenados = [...clientes].sort(
    (a, b) => ORDEN.indexOf(a.nivel) - ORDEN.indexOf(b.nivel)
  );
  const enEspera = clientes.filter((c) => c.nivel === "en_revision").length;

  return (
    <>
      <div className="admin-view-header">
        <h1 className="admin-title">Clientes</h1>
        <p className="admin-subtext">
          {enEspera > 0
            ? `${enEspera} ${enEspera === 1 ? "espera" : "esperan"} que mires sus documentos.`
            : "Nadie espera revisión ahora mismo."}
        </p>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {cargando ? (
        <p className="admin-loading">Cargando…</p>
      ) : ordenados.length === 0 ? (
        <div className="admin-empty-state">
          <p className="admin-empty">Todavía no se ha registrado nadie.</p>
        </div>
      ) : (
        <ul className="admin-clientes-lista">
          {ordenados.map((c) => (
            <li key={c.id} className="admin-card admin-cliente">
              <button type="button" className="admin-cliente-toggle" onClick={() => abrir(c.id)}>
                <span className="admin-method-label">{c.full_name ?? "Sin nombre"}</span>
                <span className={`admin-badge admin-badge-${c.nivel}`}>{ETIQUETA_NIVEL[c.nivel]}</span>
              </button>
              <p className="admin-meta">
                {c.phone ?? "sin teléfono"} · desde {formatDateTime(c.created_at)}
                {Number(c.credito_usd) > 0 && ` · adelanto hasta ${formatNumber(Number(c.credito_usd))} USD`}
              </p>

              {abierto === c.id && (
                <div className="admin-cliente-detalle">
                  <p className="admin-cell-label">Su carnet</p>
                  {(docs[c.id] ?? []).length === 0 ? (
                    <p className="admin-hint">Todavía no ha mandado documentos.</p>
                  ) : (
                    <div className="admin-method-actions">
                      {(docs[c.id] ?? []).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="admin-btn-secondary"
                          disabled={ocupado === d.id}
                          onClick={() => verDocumento(d.id)}
                        >
                          {ocupado === d.id
                            ? "Abriendo…"
                            : d.tipo === "carnet_frente"
                              ? "Ver por delante"
                              : "Ver por detrás"}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="admin-hint">
                    Al abrirlo queda escrito que lo abriste tú. El enlace caduca en un minuto.
                  </p>

                  <p className="admin-cell-label">Quién recibe en Cuba</p>
                  {(benes[c.id] ?? []).length === 0 ? (
                    <p className="admin-hint">No ha puesto a nadie todavía.</p>
                  ) : (
                    (benes[c.id] ?? []).map((b) => (
                      <p key={b.id} className="admin-meta">
                        {b.full_name}
                        {b.phone ? ` · ${b.phone}` : ""} · {b.municipio ?? "—"}
                        {b.zona ? `, ${b.zona}` : ""}, {b.provincia}
                        {b.direccion ? ` · ${b.direccion}` : ""}
                        {b.referencia ? ` · ${b.referencia}` : ""}
                      </p>
                    ))
                  )}

                  {c.revisado_por && (
                    <p className="admin-hint">
                      Revisado por {c.revisado_por}
                      {c.revisado_en ? ` el ${formatDateTime(c.revisado_en)}` : ""}.
                    </p>
                  )}

                  <p className="admin-cell-label">Decidir</p>
                  <div className="admin-method-actions">
                    {c.nivel !== "verificado" && c.nivel !== "confianza" && (
                      <button
                        type="button"
                        className="admin-btn-primary"
                        disabled={ocupado === c.id}
                        onClick={() => mover(c, "verificado", { motivo_rechazo: null })}
                      >
                        Verificar
                      </button>
                    )}
                    {c.nivel !== "rechazado" && (
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        disabled={ocupado === c.id || motivo.trim().length < 3}
                        onClick={() => mover(c, "rechazado", { motivo_rechazo: motivo.trim() })}
                      >
                        Rechazar
                      </button>
                    )}
                  </div>
                  {c.nivel !== "rechazado" && (
                    <>
                      <label className="admin-label" htmlFor={`motivo-${c.id}`}>
                        Si lo rechazas, por qué (lo verá él)
                      </label>
                      <input
                        id={`motivo-${c.id}`}
                        className="admin-input"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="La foto de atrás está borrosa"
                      />
                    </>
                  )}

                  {/* El adelanto: el número que el negocio se juega. Solo sobre
                      alguien ya verificado, y siempre a mano. */}
                  {(c.nivel === "verificado" || c.nivel === "confianza") && (
                    <>
                      <label className="admin-label" htmlFor={`credito-${c.id}`}>
                        Cuánto se le puede adelantar en Cuba (USD). 0 le quita el adelanto.
                      </label>
                      <div className="admin-rate-row">
                        <input
                          id={`credito-${c.id}`}
                          className="admin-input"
                          inputMode="decimal"
                          value={credito}
                          onChange={(e) => setCredito(e.target.value)}
                          placeholder={String(Number(c.credito_usd))}
                        />
                        <button
                          type="button"
                          className="admin-btn-primary"
                          disabled={ocupado === c.id || credito.trim() === ""}
                          onClick={() => darCredito(c)}
                        >
                          Guardar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
