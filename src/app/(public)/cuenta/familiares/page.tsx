"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCuenta } from "@/lib/cuenta";
import { municipios, zonasDe, PROVINCIA } from "@/lib/store/mensajeria";
import { COLUMNAS_FAMILIAR, type Familiar } from "@/lib/familiares";

/**
 * Los familiares guardados.
 *
 * Quien manda dinero manda casi siempre a la misma persona. Escribir otra vez
 * el nombre, el teléfono y la dirección en cada pedido no es solo incómodo:
 * es donde aparecen los errores de dirección, y un error de dirección aquí es
 * un paquete o un pago que no llega.
 */

const VACIO = { full_name: "", phone: "", municipio: "", zona: "", direccion: "", referencia: "" };

export default function FamiliaresPage() {
  const router = useRouter();
  const { user, cargando } = useCuenta();

  const [lista, setLista] = useState<Familiar[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [nuevo, setNuevo] = useState({ ...VACIO });
  const [anadiendo, setAnadiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && !user) router.replace("/entrar?volver=/cuenta/familiares");
  }, [cargando, user, router]);

  const cargar = useCallback(async (id: string) => {
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from("customer_beneficiaries")
      .select(COLUMNAS_FAMILIAR)
      .eq("customer_id", id)
      .order("created_at", { ascending: false });
    if (err) setError("No pudimos cargar tus familiares.");
    setLista((data ?? []) as Familiar[]);
    setCargandoLista(false);
  }, []);

  useEffect(() => {
    if (user) cargar(user.id);
  }, [user, cargar]);

  async function anadir(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    if (nuevo.full_name.trim().length < 2 || !nuevo.municipio) {
      setError("Hace falta al menos su nombre y su municipio.");
      return;
    }
    setGuardando(true);
    setError(null);
    const { error: err } = await supabase.from("customer_beneficiaries").insert({
      customer_id: user.id,
      full_name: nuevo.full_name.trim(),
      phone: nuevo.phone.trim() || null,
      provincia: PROVINCIA.nombre,
      municipio: nuevo.municipio,
      zona: nuevo.zona || null,
      direccion: nuevo.direccion.trim() || null,
      referencia: nuevo.referencia.trim() || null,
    });
    setGuardando(false);
    if (err) {
      setError("No se pudo guardar. Inténtalo otra vez.");
      return;
    }
    setNuevo({ ...VACIO });
    setAnadiendo(false);
    cargar(user.id);
  }

  async function quitar(id: string) {
    if (!supabase || !user) return;
    setBorrando(id);
    setError(null);
    const { error: err } = await supabase.from("customer_beneficiaries").delete().eq("id", id);
    setBorrando(null);
    if (err) {
      setError("No se pudo quitar.");
      return;
    }
    cargar(user.id);
  }

  if (cargando || !user) {
    return (
      <div className="wrap page-section">
        <p className="page-lead">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="wrap page-section cuenta-entrar">
      <Link href="/cuenta" className="cuenta-volver">
        ‹ Mi cuenta
      </Link>
      <h1 className="page-title">Tus familiares en Cuba</h1>
      <p className="page-lead">Te salen para elegir al hacer un pedido, con su dirección puesta.</p>

      {error && <p className="cuenta-error" role="alert">{error}</p>}

      {cargandoLista ? (
        <p className="page-lead">Cargando…</p>
      ) : lista.length === 0 && !anadiendo ? (
        <div className="cuenta-vacio">
          <p>Todavía no has guardado a nadie.</p>
        </div>
      ) : (
        <ul className="cuenta-lista">
          {lista.map((f) => (
            <li key={f.id} className="cuenta-envio">
              <p className="cuenta-envio-monto">{f.full_name}</p>
              <p className="cuenta-envio-fecha">
                {[f.phone, f.municipio, f.zona, f.provincia, f.direccion, f.referencia]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <button
                type="button"
                className="cuenta-envio-ver cuenta-quitar"
                disabled={borrando === f.id}
                onClick={() => quitar(f.id)}
              >
                {borrando === f.id ? "Quitando…" : "Quitar"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {anadiendo ? (
        <form className="cuenta-form" onSubmit={anadir}>
          <h2 className="cuenta-h2">Añadir a alguien</h2>
          <label className="field" htmlFor="f-nombre">
            <span>Nombre y apellidos</span>
            <input
              id="f-nombre"
              className="campo"
              value={nuevo.full_name}
              onChange={(e) => setNuevo({ ...nuevo, full_name: e.target.value })}
            />
          </label>
          <label className="field" htmlFor="f-telefono">
            <span>Su teléfono en Cuba</span>
            <input
              id="f-telefono"
              className="campo"
              type="tel"
              inputMode="tel"
              placeholder="+53 5 000 0000"
              value={nuevo.phone}
              onChange={(e) => setNuevo({ ...nuevo, phone: e.target.value })}
            />
          </label>
          <label className="field" htmlFor="f-municipio">
            <span>Municipio ({PROVINCIA.nombre})</span>
            <select
              id="f-municipio"
              className="campo"
              value={nuevo.municipio}
              onChange={(e) => setNuevo({ ...nuevo, municipio: e.target.value, zona: "" })}
            >
              <option value="">Elige uno</option>
              {municipios().map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          {nuevo.municipio && zonasDe(nuevo.municipio).length > 0 && (
            <label className="field" htmlFor="f-zona">
              <span>Zona o reparto</span>
              <select
                id="f-zona"
                className="campo"
                value={nuevo.zona}
                onChange={(e) => setNuevo({ ...nuevo, zona: e.target.value })}
              >
                <option value="">Sin especificar</option>
                {zonasDe(nuevo.municipio).map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </label>
          )}
          <label className="field" htmlFor="f-direccion">
            <span>Dirección</span>
            <input
              id="f-direccion"
              className="campo"
              value={nuevo.direccion}
              onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })}
            />
          </label>
          <label className="field" htmlFor="f-referencia">
            <span>Alguna referencia para llegar</span>
            <input
              id="f-referencia"
              className="campo"
              placeholder="Casa amarilla, al lado de la bodega"
              value={nuevo.referencia}
              onChange={(e) => setNuevo({ ...nuevo, referencia: e.target.value })}
            />
          </label>
          <div className="comprobante-acciones">
            <button
              type="button"
              className="cta cta-secondary"
              onClick={() => { setAnadiendo(false); setError(null); }}
            >
              Cancelar
            </button>
            <button className="cta" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="cta cuenta-anadir" onClick={() => setAnadiendo(true)}>
          Añadir a alguien
        </button>
      )}
    </div>
  );
}
