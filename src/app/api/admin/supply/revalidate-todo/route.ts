import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidarOferta } from "@/lib/supply/revalidarOferta";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

/** Cuántas ofertas por llamada. Ver el comentario de abajo. */
const POR_TANDA = 4;
const TOPE = 10;

/**
 * Renovar la vigencia de TODO el catálogo, por tandas.
 *
 * El problema que resuelve: la vigencia de un precio dura 24 h y hasta ahora
 * se renovaba pulsando «Revalidar ahora» oferta por oferta. Con 34 ofertas,
 * eso son 34 clics cada día. Nadie lo hizo, y el 15 de septiembre la tienda
 * amaneció con las 19 fichas vencidas y todos los productos sin poder
 * comprarse. No fue un fallo del código: fue un trabajo diario que el diseño
 * daba por hecho que alguien haría a mano.
 *
 * POR QUÉ POR TANDAS Y NO TODAS DE GOLPE. Cada oferta abre la web de su
 * proveedor y espera hasta 12 segundos. Treinta y cuatro de esas, aunque sea
 * de cuatro en cuatro, se pasan del tiempo que Vercel le da a una función y
 * la corta por la mitad: quedarían unas renovadas y otras no, sin saber
 * cuáles. Así cada llamada hace un puñado, dice cuántas quedan, y quien llama
 * vuelve a llamar hasta que no quede ninguna. Si se corta a la mitad, lo
 * hecho está hecho y se sigue desde donde iba.
 *
 * Se empieza por las que llevan más tiempo sin revisar, así una interrupción
 * nunca deja siempre a las mismas sin mirar.
 *
 * NO inventa precios: cada una vuelve a leer la página real del proveedor, y
 * la que no se pueda leer queda bloqueada y fuera del escaparate.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Hace falta sesión." }, { status: 401 });

  const sb = createClient(SUPABASE_URL, KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: admin } = await sb.rpc("es_admin");
  if (admin !== true) return NextResponse.json({ error: "Esta cuenta no administra el sitio." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const pedidas = Number(body?.porTanda);
  const porTanda = Number.isFinite(pedidas) ? Math.min(Math.max(1, Math.trunc(pedidas)), TOPE) : POR_TANDA;

  // Solo las que hacen falta: vencidas o a punto. Una que ya está vigente no
  // se vuelve a pedir al proveedor — es una visita a su web que no aporta.
  const dentroDeUnaHora = new Date(Date.now() + 3_600_000).toISOString();
  const { data: pendientes, error } = await sb
    .from("market_supplier_offers")
    .select("id")
    .or(`valid_until.is.null,valid_until.lt.${dentroDeUnaHora}`)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(porTanda);
  if (error) return NextResponse.json({ error: "No se pudo leer la lista de ofertas." }, { status: 500 });

  const resultados = [];
  for (const oferta of pendientes ?? []) {
    // En serie y no en paralelo: son webs de proveedores reales, y abrirles
    // diez conexiones a la vez desde la misma IP es la forma más rápida de
    // que nos empiecen a bloquear.
    resultados.push(await revalidarOferta(sb, oferta.id));
  }

  const { count: quedan } = await sb
    .from("market_supplier_offers")
    .select("id", { count: "exact", head: true })
    .or(`valid_until.is.null,valid_until.lt.${dentroDeUnaHora}`);

  return NextResponse.json({
    ok: true,
    procesadas: resultados.length,
    renovadas: resultados.filter((r) => r.renovada).length,
    bloqueadas: resultados.filter((r) => r.bloqueada).length,
    fallidas: resultados.filter((r) => !r.ok).length,
    quedan: quedan ?? 0,
    detalle: resultados,
  });
}
