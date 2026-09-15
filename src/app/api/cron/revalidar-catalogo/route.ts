import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidarOferta } from "@/lib/supply/revalidarOferta";

export const dynamic = "force-dynamic";
/** Vercel corta la función a los 60 s en el plan gratuito. Ver el tope de abajo. */
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

/** Se para sola antes de que Vercel la corte, para no dejar nada a medias. */
const TOPE_MS = 45_000;

/**
 * El riego diario del catálogo.
 *
 * La vigencia de un precio dura 24 h. Hasta ahora había que renovarla a mano,
 * oferta por oferta, 34 clics cada día. El 15 de septiembre nadie los dio y la
 * tienda amaneció con todo «no disponible»: no falló ningún código, faltó un
 * trabajo diario que el diseño daba por hecho.
 *
 * Esto lo hace solo, de madrugada, antes de que abra nadie.
 *
 * NO inventa precios. Cada oferta se vuelve a leer de la web real de su
 * proveedor; la que no se pueda leer queda bloqueada y su producto sale del
 * escaparate. Prefiere una tienda con menos cosas a una que promete un precio
 * que nadie comprobó.
 *
 * Empieza por las que llevan más tiempo sin mirar y se para a los 45 s. Si no
 * le da tiempo a todas, mañana sigue por donde iba y ninguna se queda
 * eternamente sin revisar.
 *
 * HACEN FALTA DOS VARIABLES EN VERCEL:
 *   · CRON_SECRET               — para que solo Vercel pueda dispararlo.
 *   · SUPABASE_SERVICE_ROLE_KEY — aquí no hay sesión de nadie, así que escribe
 *                                 con la llave de servicio. Esa llave salta el
 *                                 RLS: vive SOLO en el servidor, nunca en el
 *                                 navegador ni en el repositorio.
 * Sin ellas, la ruta responde 503 y lo dice, en vez de fallar callada.
 */
export async function GET(request: Request) {
  if (!CRON_SECRET || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Faltan CRON_SECRET o SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const dentroDeUnaHora = new Date(Date.now() + 3_600_000).toISOString();
  const { data: pendientes, error } = await sb
    .from("market_supplier_offers")
    .select("id")
    .or(`valid_until.is.null,valid_until.lt.${dentroDeUnaHora}`)
    .order("last_checked_at", { ascending: true, nullsFirst: true });
  if (error) return NextResponse.json({ error: "No se pudo leer la lista de ofertas." }, { status: 500 });

  const empezo = Date.now();
  let renovadas = 0, bloqueadas = 0, fallidas = 0, vistas = 0;

  for (const oferta of pendientes ?? []) {
    if (Date.now() - empezo > TOPE_MS) break;
    const r = await revalidarOferta(sb, oferta.id);
    vistas += 1;
    if (!r.ok) fallidas += 1;
    else if (r.bloqueada) bloqueadas += 1;
    else renovadas += 1;
  }

  return NextResponse.json({
    ok: true,
    pendientes: pendientes?.length ?? 0,
    vistas,
    renovadas,
    bloqueadas,
    fallidas,
    quedan: (pendientes?.length ?? 0) - vistas,
    segundos: Math.round((Date.now() - empezo) / 1000),
  });
}
