import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { revalidarOferta } from "@/lib/supply/revalidarOferta";

export const dynamic = "force-dynamic";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

/**
 * Revalidar una oferta suelta, desde el botón «Revalidar ahora» del panel.
 *
 * El trabajo de verdad vive en `@/lib/supply/revalidarOferta`, compartido con
 * la renovación de todo el catálogo. Antes estaba escrito aquí dentro; se
 * sacó para que las dos rutas no pudieran separarse y acabar renovando
 * precios con reglas distintas.
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
  const offerId = typeof body.offerId === "string" ? body.offerId : "";
  if (!offerId) return NextResponse.json({ error: "Falta la oferta." }, { status: 400 });

  const r = await revalidarOferta(sb, offerId);
  if (!r.ok) {
    const noExiste = r.motivo === "Oferta no encontrada.";
    return NextResponse.json({ error: r.motivo }, { status: noExiste ? 404 : 400 });
  }

  // Mismas claves que antes: el panel ya las lee y no hay por qué moverlas.
  return NextResponse.json({
    ok: true,
    severity: r.severidad,
    blocksPurchase: r.bloqueada,
    price: r.precio,
  });
}
