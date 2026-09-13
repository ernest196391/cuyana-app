"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCuenta, ETIQUETA_NIVEL, EXPLICACION_NIVEL, tienePalomita } from "@/lib/cuenta";
// Dos convenciones para el GYD conviven en la web, y esta pantalla enseña las
// dos cosas, así que hay que elegir bien cuál va en cada línea:
//   · las remesas se escriben como en la calculadora — `formatNumber`, «45.000»
//   · la tienda se escribe como en la tienda — `formatGyd`, «G$45,000»
// Nunca `formatMoney` para GYD: le pondría dos decimales y saldría
// «45.000,00», que no se escribe así en ningún sitio de la web.
import { formatMoney, formatNumber, formatDateTime, formatGyd, formatUsd } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import { useDeliveryMethods } from "@/lib/useDeliveryMethods";
import SeguimientoCliente from "@/components/SeguimientoCliente";

interface Remesa {
  id: number;
  amount_gyd: number;
  amount_cup: number;
  ref_code: string | null;
  created_at: string;
  method_key: string | null;
  tracking_ref: string | null;
}

interface PedidoTienda {
  id: string;
  code: string;
  category: string;
  total_gyd: number | null;
  total_usd: number;
  created_at: string;
  recipient_name: string | null;
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, perfil, cargando } = useCuenta();
  // `amount_cup` se llama así por historia, pero guarda lo que recibió la
  // familia en la moneda del método: con «USD en efectivo» son dólares.
  // Escribir «CUP» al lado de una cifra en dólares sería decirle al cliente
  // que mandó otra cosa.
  const { methods } = useDeliveryMethods();
  const monedaDe = (clave: string | null) =>
    methods.find((m) => m.key === clave)?.target_currency ?? "CUP";

  const [remesas, setRemesas] = useState<Remesa[]>([]);
  const [pedidos, setPedidos] = useState<PedidoTienda[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  // El código de referido y cuántos han pedido con él. Solo para verificados:
  // un código que pueda sacarse cualquiera que escriba un correo es una
  // invitación a fabricarse cuentas para cobrarse a sí mismo.
  const [codigo, setCodigo] = useState<string | null>(null);
  const [referidos, setReferidos] = useState<number | null>(null);
  const [sacando, setSacando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [abierto, setAbierto] = useState<number | null>(null);

  useEffect(() => {
    if (!cargando && !user) router.replace("/entrar?volver=/cuenta");
  }, [cargando, user, router]);

  const cargarHistorial = useCallback(async (id: string) => {
    if (!supabase) return;
    // Las políticas ya limitan cada tabla a lo suyo, pero se filtra igualmente
    // por customer_id: una consulta no debe depender de que la política esté
    // bien para no traer de más.
    const [r, p] = await Promise.all([
      supabase
        .from("orders")
        .select("id, amount_gyd, amount_cup, ref_code, created_at, method_key, tracking_ref")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("store_orders")
        .select("id, code, category, total_gyd, total_usd, created_at, recipient_name")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);
    setRemesas((r.data ?? []) as Remesa[]);
    setPedidos((p.data ?? []) as PedidoTienda[]);
    setCargandoHistorial(false);
  }, []);

  useEffect(() => {
    if (user) cargarHistorial(user.id);
  }, [user, cargarHistorial]);

  // Si ya tiene código se lee; no se crea nada al abrir la pantalla.
  useEffect(() => {
    if (!user || !supabase) return;
    let vivo = true;
    (async () => {
      const [{ data: fila }, { data: cuantos }] = await Promise.all([
        supabase!.from("referrals").select("code").eq("customer_id", user.id).maybeSingle(),
        supabase!.rpc("mis_referidos"),
      ]);
      if (!vivo) return;
      setCodigo((fila?.code as string) ?? null);
      setReferidos(typeof cuantos === "number" ? cuantos : 0);
    })();
    return () => { vivo = false; };
  }, [user]);

  async function sacarCodigo() {
    if (!supabase) return;
    setSacando(true);
    const { data, error } = await supabase.rpc("mi_codigo_de_referido");
    setSacando(false);
    if (error || typeof data !== "string") return;
    setCodigo(data);
  }

  async function copiarEnlace() {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/enviar-dinero?ref=${codigo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin portapapeles no se finge que se copió: el código está a la vista.
      setCopiado(false);
    }
  }

  async function salir() {
    await supabase?.auth.signOut();
    router.replace("/");
  }

  if (cargando || !user) {
    return (
      <div className="wrap page-section">
        <p className="page-lead">Cargando…</p>
      </div>
    );
  }

  const nivel = perfil?.nivel ?? "sin_verificar";
  // Solo se suma lo que se envió de verdad, en la moneda en que se pagó. No se
  // convierte nada: cada envío llevó su tasa y una suma «equivalente a hoy»
  // sería un número que nunca existió.
  const totalEnviado = remesas.reduce((s, r) => s + Number(r.amount_gyd), 0);
  const totalTienda = pedidos.reduce((s, p) => s + Number(p.total_gyd ?? 0), 0);
  const desde = [...remesas, ...pedidos]
    .map((x) => x.created_at)
    .sort()[0];

  const whatsappAdelanto =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(
      `Hola, soy ${perfil?.full_name ?? user.email}. Tengo la cuenta verificada en Cuyana y ` +
        `quería preguntar por la entrega adelantada en Cuba.`
    );

  return (
    <div className="wrap page-section cuenta">
      <header className="cuenta-cabecera">
        <div>
          <h1 className="page-title">{perfil?.full_name ?? "Mi cuenta"}</h1>
          <p className="cuenta-correo">{user.email}</p>
        </div>
        <button type="button" className="cuenta-salir" onClick={salir}>
          Salir
        </button>
      </header>

      {/* La palomita. Es lo primero que mira quien la tiene, y lo primero que
          echa en falta quien no. */}
      <div className={tienePalomita(nivel) ? "cuenta-nivel cuenta-nivel-ok" : "cuenta-nivel"}>
        <span className="cuenta-nivel-icono" aria-hidden="true">
          {tienePalomita(nivel) ? "✓" : "!"}
        </span>
        <div>
          <p className="cuenta-nivel-titulo">{ETIQUETA_NIVEL[nivel]}</p>
          <p className="cuenta-nivel-texto">{EXPLICACION_NIVEL[nivel]}</p>
          {nivel === "rechazado" && perfil?.motivo_rechazo && (
            <p className="cuenta-nivel-motivo">{perfil.motivo_rechazo}</p>
          )}
        </div>
        {(nivel === "sin_verificar" || nivel === "rechazado") && (
          <Link href="/cuenta/verificar" className="cuenta-nivel-cta">
            Verificar
          </Link>
        )}
      </div>

      {/* El adelanto no se gestiona aquí: lo decide Adonys hablando con la
          persona. La app solo abre la conversación. */}
      {nivel === "confianza" && (
        <a className="cta cta-secondary cuenta-adelanto" href={whatsappAdelanto} target="_blank" rel="noopener">
          Pedir entrega adelantada en Cuba
        </a>
      )}

      <div className="cuenta-resumen">
        <div className="cuenta-dato">
          <span className="cuenta-dato-num">{remesas.length}</span>
          <span className="cuenta-dato-etq">{remesas.length === 1 ? "envío" : "envíos"}</span>
        </div>
        <div className="cuenta-dato">
          <span className="cuenta-dato-num">{formatNumber(totalEnviado)}</span>
          <span className="cuenta-dato-etq">enviados (GYD)</span>
        </div>
        {pedidos.length > 0 && (
          <div className="cuenta-dato">
            <span className="cuenta-dato-num">{formatGyd(totalTienda)}</span>
            <span className="cuenta-dato-etq">en la tienda</span>
          </div>
        )}
        {desde && (
          <div className="cuenta-dato">
            <span className="cuenta-dato-num">{new Date(desde).getFullYear()}</span>
            <span className="cuenta-dato-etq">cliente desde</span>
          </div>
        )}
      </div>

      {/* Referidos. Cuánto se le da por cada amigo que traiga lo decide Adonys
          en el panel; aquí no se promete ningún número. */}
      {tienePalomita(nivel) && (
        <div className="cuenta-referidos">
          <p className="cuenta-nivel-titulo">Trae a alguien</p>
          {codigo ? (
            <>
              <p className="cuenta-nivel-texto">
                Este es tu código. Quien pida con tu enlace queda anotado a tu nombre.
              </p>
              <p className="cuenta-codigo">{codigo}</p>
              {referidos !== null && (
                <p className="cuenta-nivel-texto">
                  {referidos === 0
                    ? "Todavía no ha pedido nadie con él."
                    : `${referidos} ${referidos === 1 ? "pedido" : "pedidos"} han entrado con tu código.`}
                </p>
              )}
              <button type="button" className="cta cta-secondary" onClick={copiarEnlace}>
                {copiado ? "Enlace copiado" : "Copiar tu enlace"}
              </button>
            </>
          ) : (
            <>
              <p className="cuenta-nivel-texto">
                Saca tu código y compártelo. Quien pida con él queda anotado a tu nombre.
              </p>
              <button type="button" className="cta cta-secondary" onClick={sacarCodigo} disabled={sacando}>
                {sacando ? "Un momento…" : "Sacar mi código"}
              </button>
            </>
          )}
        </div>
      )}

      <p className="cuenta-atajos">
        <Link href="/cuenta/familiares">Tus familiares en Cuba</Link>
      </p>

      <h2 className="cuenta-h2">Tus envíos</h2>
      {cargandoHistorial ? (
        <p className="page-lead">Cargando…</p>
      ) : remesas.length === 0 ? (
        <div className="cuenta-vacio">
          <p>Todavía no has enviado nada con tu cuenta.</p>
          <Link href="/enviar-dinero" className="cta cuenta-vacio-cta">
            Enviar dinero
          </Link>
        </div>
      ) : (
        <ul className="cuenta-lista">
          {remesas.map((r) => (
            <li key={r.id} className="cuenta-envio">
              <div className="cuenta-envio-fila">
                <div>
                  <p className="cuenta-envio-monto">
                    {formatNumber(Number(r.amount_gyd))} GYD →{" "}
                    {formatMoney(Number(r.amount_cup), monedaDe(r.method_key))} {monedaDe(r.method_key)}
                  </p>
                  <p className="cuenta-envio-fecha">
                    {formatDateTime(r.created_at)}
                    {r.ref_code ? ` · ${r.ref_code}` : ""}
                  </p>
                </div>
              </div>
              {r.tracking_ref ? (
                <>
                  <button
                    type="button"
                    className="cuenta-envio-ver"
                    onClick={() => setAbierto(abierto === r.id ? null : r.id)}
                    aria-expanded={abierto === r.id}
                  >
                    {abierto === r.id ? "Ocultar" : "Ver por dónde va"}
                  </button>
                  {abierto === r.id && (
                    <>
                      <SeguimientoCliente referencia={r.tracking_ref} />
                      {/* Un enlace, no una captura: lo que le mande a su familia
                          se actualiza solo según avanza el envío. */}
                      <a
                        className="cuenta-envio-ver"
                        href={`/envio/${r.tracking_ref}`}
                        target="_blank"
                        rel="noopener"
                      >
                        Abrir el comprobante para enseñárselo a tu familia
                      </a>
                    </>
                  )}
                </>
              ) : (
                <p className="cuenta-envio-sin">
                  Este lo coordinaste por WhatsApp. Escríbenos por ahí para saber cómo va.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {pedidos.length > 0 && (
        <>
          <h2 className="cuenta-h2">Tus pedidos de la tienda</h2>
          <ul className="cuenta-lista">
            {pedidos.map((p) => (
              <li key={p.id} className="cuenta-envio">
                <p className="cuenta-envio-monto">
                  {p.category === "energia" ? "Energía" : "Alimentos"} ·{" "}
                  {/* Un pedido de tienda se escribe como en la tienda —G$45,000—
                      y no como una remesa. El mismo pedido leído de dos maneras
                      en dos pantallas hace dudar de si son el mismo. */}
                  {p.total_gyd ? formatGyd(Number(p.total_gyd)) : formatUsd(Number(p.total_usd))}
                </p>
                <p className="cuenta-envio-fecha">
                  {formatDateTime(p.created_at)} · {p.code}
                  {p.recipient_name ? ` · para ${p.recipient_name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
