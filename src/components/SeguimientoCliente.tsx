"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import {
  ETIQUETA,
  EXPLICACION,
  cuandoPaso,
  estadoActual,
  esIncidencia,
  flujoDe,
  incidenciasDe,
  pasosDe,
  type Salto,
} from "@/lib/seguimiento";

/**
 * La línea de tiempo de un envío, para quien lo mandó o para su familia.
 *
 * Se pide con `seguimiento(ref)`, una función de la base que devuelve el paso,
 * el flujo, la nota pública y la hora. La nota interna no sale de ahí: lo que
 * se apunta para trabajar no es asunto de quien compró.
 *
 * La cadena que se pinta depende del flujo. Un pedido de comida no pasa por
 * Guyana, y enseñarle esos pasos sería contarle algo que no está pasando.
 */
export default function SeguimientoCliente({ referencia }: { referencia: string }) {
  const [saltos, setSaltos] = useState<Salto[] | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase.rpc("seguimiento", { ref: referencia });
      if (!vivo) return;
      if (error) { setFallo(true); setSaltos([]); return; }
      setSaltos((data ?? []) as Salto[]);
    })();
    return () => { vivo = false; };
  }, [referencia]);

  if (saltos === null) {
    return <p className="seg-cargando">Buscando tu envío…</p>;
  }

  if (fallo) {
    return <p className="seg-cargando">No pudimos leer el estado ahora mismo. Recarga en un minuto.</p>;
  }

  if (saltos.length === 0) {
    return <p className="seg-cargando">Todavía no hay movimientos de este envío.</p>;
  }

  const actual = estadoActual(saltos);
  const pasos = pasosDe(flujoDe(saltos));
  const incidencias = incidenciasDe(saltos);

  return (
    <div className="seg">
      {actual && (
        <p className="seg-ahora">
          <strong>{ETIQUETA[actual]}</strong> — {EXPLICACION[actual]}
        </p>
      )}

      <ol className="seg-lista">
        {pasos.map((paso, i) => {
          const cuando = cuandoPaso(saltos, paso);
          const hecho = cuando !== null;
          return (
            <li key={paso} className={hecho ? "seg-paso seg-paso-hecho" : "seg-paso"}>
              <span className="seg-punto" aria-hidden="true" />
              {/* El hilo une un punto con el siguiente; del último no sale. */}
              {i < pasos.length - 1 && <span className="seg-hilo" aria-hidden="true" />}
              <span className="seg-nombre">{ETIQUETA[paso]}</span>
              <span className="seg-cuando">{cuando ? formatDateTime(cuando) : "Pendiente"}</span>
            </li>
          );
        })}
      </ol>

      {/* Las incidencias van aparte y no dentro de la cadena: no son un paso
          hacia adelante, y meterlas entre los pasos haría parecer que el
          envío avanzó cuando lo que pasó fue que se torció. */}
      {incidencias.length > 0 && (
        <ul className="seg-incidencias">
          {incidencias.map((s, i) => (
            <li key={`${s.estado}-${i}`} className={s.estado === "cancelado" ? "seg-incidencia seg-incidencia-grave" : "seg-incidencia"}>
              <strong>{ETIQUETA[s.estado]}</strong>
              <span>{s.nota_publica || EXPLICACION[s.estado]}</span>
              <time>{formatDateTime(s.cuando)}</time>
            </li>
          ))}
        </ul>
      )}

      {actual && esIncidencia(actual) && actual !== "cancelado" && (
        <p className="seg-nota">Seguimos con tu envío. Te avisamos en cuanto se resuelva.</p>
      )}
    </div>
  );
}
