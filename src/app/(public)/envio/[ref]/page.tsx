"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatGyd, formatMoney, formatNumber, formatUsd } from "@/lib/format";
import { useDeliveryMethods } from "@/lib/useDeliveryMethods";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import SeguimientoCliente from "@/components/SeguimientoCliente";

interface Comprobante {
  /** Una remesa y un pedido de tienda se enseñan distinto. */
  tipo: "remesa" | "tienda";
  amount_gyd: number | null;
  amount_cup: number | null;
  method_key: string | null;
  total_usd: number | null;
  categoria: string | null;
  creado: string;
}

/**
 * El comprobante de un envío, para enseñárselo a la familia.
 *
 * Abierto a propósito: la referencia es un UUID que solo tiene quien mandó el
 * dinero, y pedirle a una señora en Centro Habana que se cree una cuenta para
 * ver si le llegó lo suyo es pedirle que no lo mire.
 *
 * Sale cuánto, por qué método, cuándo y por dónde va. No sale quién lo mandó.
 */
export default function ComprobantePage({ params }: { params: { ref: string } }) {
  const { methods } = useDeliveryMethods();
  const [envio, setEnvio] = useState<Comprobante | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-existe">("cargando");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase.rpc("comprobante", { ref: params.ref });
      if (!vivo) return;
      const filas = (data ?? []) as Comprobante[];
      if (error || filas.length === 0) {
        setEstado("no-existe");
        return;
      }
      setEnvio(filas[0]);
      setEstado("listo");
    })();
    return () => { vivo = false; };
  }, [params.ref]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin portapapeles —o sin permiso— el enlace sigue estando en la barra
      // de direcciones. No se finge que se copió.
      setCopiado(false);
    }
  }

  if (estado === "cargando") {
    return (
      <div className="wrap page-section">
        <p className="page-lead">Buscando tu envío…</p>
      </div>
    );
  }

  if (estado === "no-existe" || !envio) {
    return (
      <div className="wrap page-section cuenta-entrar">
        <h1 className="page-title">No encontramos ese envío</h1>
        <p className="page-lead">
          Puede que el enlace esté incompleto. Pídeselo otra vez a quien te lo mandó, o
          escríbenos y lo miramos.
        </p>
        <a className="cta" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  const metodo = methods.find((m) => m.key === envio.method_key);
  const moneda = metodo?.target_currency ?? "CUP";
  const esTienda = envio.tipo === "tienda";

  return (
    <div className="wrap page-section cuenta-entrar">
      <h1 className="page-title">{esTienda ? "Tu pedido por Cuyana" : "Tu envío por Cuyana"}</h1>
      <p className="page-lead">{formatDateTime(envio.creado)}</p>

      {/* Un pedido de tienda se enseña por lo que costó y de qué es. Un envío
          de dinero, por lo que sale y lo que llega. Son dos cosas distintas y
          forzarlas al mismo molde deja una de las dos en blanco. */}
      <div className="comprobante">
        {esTienda ? (
          <>
            <p className="comprobante-linea">
              <span>Pedido de</span>
              <strong>{envio.categoria === "energia" ? "Energía" : "Alimentos"}</strong>
            </p>
            <p className="comprobante-linea comprobante-destacado">
              <span>Total</span>
              <strong>
                {envio.amount_gyd ? formatGyd(Number(envio.amount_gyd)) : formatUsd(Number(envio.total_usd))}
              </strong>
            </p>
          </>
        ) : (
          <>
            <p className="comprobante-linea">
              <span>Enviado</span>
              <strong>{formatNumber(Number(envio.amount_gyd))} GYD</strong>
            </p>
            <p className="comprobante-linea comprobante-destacado">
              <span>Recibe en Cuba</span>
              <strong>
                {formatMoney(Number(envio.amount_cup), moneda)} {moneda}
              </strong>
            </p>
            {metodo && (
              <p className="comprobante-linea">
                <span>Cómo</span>
                <strong>{metodo.label}</strong>
              </p>
            )}
          </>
        )}
      </div>

      <h2 className="cuenta-h2">Por dónde va</h2>
      <SeguimientoCliente referencia={params.ref} />

      <div className="comprobante-acciones">
        <button type="button" className="cta cta-secondary" onClick={copiar}>
          {copiado ? "Enlace copiado" : "Copiar el enlace"}
        </button>
        <a
          className="cta"
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            "Hola, tengo una pregunta sobre mi envío."
          )}`}
          target="_blank"
          rel="noopener"
        >
          Preguntar por WhatsApp
        </a>
      </div>

      <p className="cuenta-pie">
        ¿Quieres mandar tú? <Link href="/enviar-dinero">Mira la tasa de hoy</Link>.
      </p>
    </div>
  );
}
