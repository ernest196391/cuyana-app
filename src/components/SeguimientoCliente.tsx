"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import {
  ETIQUETA,
  EXPLICACION,
  PASOS,
  cuandoPaso,
  estadoActual,
  type Salto,
} from "@/lib/seguimiento";

/**
 * La línea de tiempo de un envío, para quien lo mandó.
 *
 * Se pide con `seguimiento(ref)`, una función de la base que devuelve el paso
 * y la hora y nada más: ni montos, ni márgenes, ni quién lo atendió. Aunque
 * alguien consiguiera la referencia de otro, no saca de aquí nada que no sea
 * «va por aquí».
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

  const actual = estadoActual(saltos);

  return (
    <div className="seg">
      {actual && (
        <p className="seg-ahora">
          <strong>{ETIQUETA[actual]}</strong> — {EXPLICACION[actual]}
        </p>
      )}

      <ol className="seg-lista">
        {PASOS.map((paso, i) => {
          const cuando = cuandoPaso(saltos, paso);
          const hecho = cuando !== null;
          return (
            <li key={paso} className={hecho ? "seg-paso seg-paso-hecho" : "seg-paso"}>
              <span className="seg-punto" aria-hidden="true" />
              {/* El hilo une un punto con el siguiente; del último no sale. */}
              {i < PASOS.length - 1 && <span className="seg-hilo" aria-hidden="true" />}
              <span className="seg-nombre">{ETIQUETA[paso]}</span>
              <span className="seg-cuando">{cuando ? formatDateTime(cuando) : "Pendiente"}</span>
            </li>
          );
        })}
      </ol>

      {actual === "cancelado" && (
        <p className="seg-cancelado">{EXPLICACION.cancelado}</p>
      )}
    </div>
  );
}
