"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCuenta } from "@/lib/cuenta";
import { municipios, zonasDe, PROVINCIA } from "@/lib/store/mensajeria";

/**
 * Verificar la cuenta: el carnet por las dos caras y quién recibe en Cuba.
 *
 * El carnet no se sube «a la web»: va a un almacén privado donde cada persona
 * solo alcanza su propia carpeta, y de ahí solo lo saca un administrador, con
 * su nombre apuntado en una bitácora. Eso se decidió al crear el almacén y
 * aquí solo se usa.
 *
 * Al terminar, la cuenta pasa a «en revisión». A verificada la mueve una
 * persona mirando los papeles, no esta pantalla.
 */

const CARAS = [
  { tipo: "carnet_frente" as const, etiqueta: "Carnet por delante" },
  { tipo: "carnet_reverso" as const, etiqueta: "Carnet por detrás" },
];

const MAX_BYTES = 8 * 1024 * 1024;

export default function VerificarPage() {
  const router = useRouter();
  const { user, perfil, cargando, refrescar } = useCuenta();

  const [archivos, setArchivos] = useState<Record<string, File | null>>({});
  const [subidos, setSubidos] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [zona, setZona] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!cargando && !user) router.replace("/entrar?volver=/cuenta/verificar");
  }, [cargando, user, router]);

  // Qué caras ya mandó antes. Así se le dice «ya la tenemos» en vez de
  // pedirle otra vez algo que ya subió.
  useEffect(() => {
    if (!user || !supabase) return;
    (async () => {
      const { data } = await supabase!
        .from("customer_documents")
        .select("tipo")
        .eq("customer_id", user.id);
      setSubidos((data ?? []).map((d) => d.tipo as string));
    })();
  }, [user]);

  function elegir(tipo: string, lista: FileList | null) {
    const f = lista?.[0] ?? null;
    setError(null);
    if (f && f.size > MAX_BYTES) {
      setError("Esa foto pesa más de 8 MB. Hazla más pequeña o usa otra.");
      return;
    }
    setArchivos((a) => ({ ...a, [tipo]: f }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setError(null);

    const faltan = CARAS.filter((c) => !archivos[c.tipo] && !subidos.includes(c.tipo));
    if (faltan.length > 0) {
      setError(`Falta ${faltan.map((f) => f.etiqueta.toLowerCase()).join(" y ")}.`);
      return;
    }
    if (nombre.trim().length < 2 || telefono.trim().length < 6 || !municipio) {
      setError("Dinos quién recibe en Cuba: nombre, teléfono y municipio.");
      return;
    }

    setEnviando(true);
    try {
      for (const cara of CARAS) {
        const f = archivos[cara.tipo];
        if (!f) continue;
        setPaso(`Subiendo ${cara.etiqueta.toLowerCase()}…`);
        // La carpeta lleva el id de quien sube: es lo que hace cumplir la
        // regla del almacén de que nadie escriba en la carpeta de otro. El
        // nombre es fijo para que volver a mandarla reemplace la anterior en
        // vez de acumular copias del carnet de alguien.
        const ruta = `${user.id}/${cara.tipo}`;
        const { error: errSubida } = await supabase.storage
          .from("documentos-clientes")
          .upload(ruta, f, { upsert: true, contentType: f.type || "image/jpeg" });
        if (errSubida) throw new Error(`No se pudo subir ${cara.etiqueta.toLowerCase()}.`);

        const { error: errFicha } = await supabase
          .from("customer_documents")
          .upsert({ customer_id: user.id, tipo: cara.tipo, ruta }, { onConflict: "customer_id,tipo" });
        if (errFicha) throw new Error(`No se pudo guardar ${cara.etiqueta.toLowerCase()}.`);
      }

      setPaso("Guardando a quien recibe…");
      const { error: errBenef } = await supabase.from("customer_beneficiaries").insert({
        customer_id: user.id,
        full_name: nombre.trim(),
        phone: telefono.trim(),
        provincia: PROVINCIA.nombre,
        municipio,
        zona: zona || null,
        direccion: direccion.trim() || null,
        referencia: referencia.trim() || null,
      });
      if (errBenef) throw new Error("No se pudo guardar a quien recibe.");

      setPaso("Mandando a revisar…");
      // Este es el único movimiento de nivel que puede hacer el cliente, y la
      // base lo comprueba: cualquier otro lo rechaza.
      const { error: errNivel } = await supabase
        .from("customer_profiles")
        .update({ nivel: "en_revision" })
        .eq("id", user.id);
      if (errNivel) throw new Error("Se guardó todo, pero no pudimos marcarla para revisión. Escríbenos.");

      await refrescar();
      setListo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo falló. Inténtalo otra vez.");
    } finally {
      setEnviando(false);
      setPaso(null);
    }
  }

  if (cargando || !user) {
    return (
      <div className="wrap page-section">
        <p className="page-lead">Cargando…</p>
      </div>
    );
  }

  if (listo || perfil?.nivel === "en_revision") {
    return (
      <div className="wrap page-section cuenta-entrar">
        <h1 className="page-title">Ya lo tenemos</h1>
        <p className="page-lead">
          Estamos revisando tus datos. Te avisamos por WhatsApp en cuanto esté. No hace falta que
          mandes nada más.
        </p>
        <Link href="/cuenta" className="cta">
          Volver a mi cuenta
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap page-section cuenta-entrar">
      <h1 className="page-title">Verifica tu cuenta</h1>
      {/* Corto, pero sin quitar la promesa: a alguien se le está pidiendo el
          carnet y tiene derecho a saber dónde acaba antes de mandarlo. */}
      <p className="page-lead">
        Dos fotos de tu carnet y quién recibe en Cuba. Tus documentos no se publican en ningún
        sitio: solo los abre quien administra, y queda registrado.
      </p>

      <form className="cuenta-form" onSubmit={enviar}>
        <h2 className="cuenta-h2">Tu carnet</h2>
        {CARAS.map((cara) => (
          <label className="field" key={cara.tipo} htmlFor={cara.tipo}>
            <span>{cara.etiqueta}</span>
            <input
              id={cara.tipo}
              className="campo cuenta-archivo"
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => elegir(cara.tipo, e.target.files)}
            />
            {archivos[cara.tipo] ? (
              <small className="cuenta-ayuda">{archivos[cara.tipo]!.name}</small>
            ) : subidos.includes(cara.tipo) ? (
              <small className="cuenta-ayuda">Ya nos la mandaste. Sube otra solo si quieres cambiarla.</small>
            ) : null}
          </label>
        ))}

        <h2 className="cuenta-h2">Quién recibe en Cuba</h2>
        <label className="field" htmlFor="b-nombre">
          <span>Nombre y apellidos</span>
          <input id="b-nombre" className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="field" htmlFor="b-telefono">
          <span>Su teléfono en Cuba</span>
          <input
            id="b-telefono"
            className="campo"
            type="tel"
            inputMode="tel"
            placeholder="+53 5 000 0000"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </label>
        <label className="field" htmlFor="b-municipio">
          <span>Municipio ({PROVINCIA.nombre})</span>
          <select
            id="b-municipio"
            className="campo"
            value={municipio}
            onChange={(e) => { setMunicipio(e.target.value); setZona(""); }}
          >
            <option value="">Elige uno</option>
            {municipios().map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        {municipio && zonasDe(municipio).length > 0 && (
          <label className="field" htmlFor="b-zona">
            <span>Zona o reparto</span>
            <select id="b-zona" className="campo" value={zona} onChange={(e) => setZona(e.target.value)}>
              <option value="">Sin especificar</option>
              {zonasDe(municipio).map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </label>
        )}
        <label className="field" htmlFor="b-direccion">
          <span>Dirección</span>
          <input id="b-direccion" className="campo" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </label>
        <label className="field" htmlFor="b-referencia">
          <span>Alguna referencia para llegar</span>
          <input
            id="b-referencia"
            className="campo"
            placeholder="Casa amarilla, al lado de la bodega"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </label>

        <button className="cta" type="submit" disabled={enviando}>
          {enviando ? paso ?? "Enviando…" : "Mandar a revisar"}
        </button>
        {error && <p className="cuenta-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
