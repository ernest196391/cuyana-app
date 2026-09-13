import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auditSupplierObservation, highestSeverity } from "@/lib/supply/audit";
import { extractProductPage } from "@/lib/supply/extractProductPage";
import { safeSourceUrl } from "@/lib/supply/safeSourceUrl";

export const dynamic = "force-dynamic";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

async function fetchPublicSource(initial: URL): Promise<Response> {
  let current = initial;
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await fetch(current, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const next = safeSourceUrl(new URL(response.headers.get("location") ?? "", current).toString());
    if (!next) throw new Error("Redirección insegura");
    current = next;
  }
  throw new Error("Demasiadas redirecciones");
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Hace falta sesión." }, { status: 401 });
  const sb = createClient(SUPABASE_URL, KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: admin } = await sb.rpc("es_admin");
  if (admin !== true) return NextResponse.json({ error: "Esta cuenta no administra el sitio." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const offerId = typeof body.offerId === "string" ? body.offerId : "";
  if (!offerId) return NextResponse.json({ error: "Falta la oferta." }, { status: 400 });

  const { data: offer, error } = await sb.from("market_supplier_offers").select("id,product_id,source_url,source_price,currency,availability,presentation,composition,supplier_shipping,destination_scope,eta_text").eq("id", offerId).maybeSingle();
  if (error || !offer) return NextResponse.json({ error: "Oferta no encontrada." }, { status: 404 });
  const sourceUrl = safeSourceUrl(offer.source_url);
  if (!sourceUrl) return NextResponse.json({ error: "La URL de origen no es pública y segura." }, { status: 400 });
  const { data: previous } = await sb.from("market_supplier_observations").select("id,price,availability,presentation,composition,supplier_shipping,destination_scope,eta_text,source_reachable").eq("offer_id", offer.id).order("observed_at", { ascending: false }).limit(1).maybeSingle();
  let response: Response;
  try { response = await fetchPublicSource(sourceUrl); }
  catch { response = new Response("", { status: 599 }); }
  const html = response.ok ? await response.text() : "";
  const extracted = response.ok ? extractProductPage(html) : { price: null, available: false, currency: null };
  const before = previous ? { price: Number(previous.price ?? offer.source_price), available: previous.availability === "available" ? true : previous.availability === "unavailable" ? false : null, presentation: previous.presentation, composition: previous.composition, eta: previous.eta_text, shipping: previous.supplier_shipping, destinationScope: previous.destination_scope, sourceReachable: previous.source_reachable } : { price: Number(offer.source_price), available: offer.availability === "available", presentation: offer.presentation, composition: offer.composition, eta: offer.eta_text, shipping: offer.supplier_shipping, destinationScope: offer.destination_scope, sourceReachable: true };
  const after = { ...before, price: extracted.price ?? before.price, available: extracted.available, sourceReachable: response.ok };
  const diffs = auditSupplierObservation(before, after);
  const severity = highestSeverity(diffs);
  const blocksPurchase = severity === "CRITICAL" || extracted.price === null || extracted.available !== true;

  const { data: observation, error: observationError } = await sb.from("market_supplier_observations").insert({ offer_id: offer.id, http_status: response.status, resolved_url: response.url || offer.source_url, source_reachable: response.ok, price: extracted.price, currency: extracted.currency ?? offer.currency, availability: extracted.available === true ? "available" : extracted.available === false ? "unavailable" : "unknown", presentation: offer.presentation, composition: offer.composition, supplier_shipping: offer.supplier_shipping, destination_scope: offer.destination_scope, eta_text: offer.eta_text, extraction_confidence: extracted.price !== null ? 90 : 25, snapshot: { extractor: "product-jsonld-v1" } }).select("id").single();
  if (observationError || !observation) return NextResponse.json({ error: "No se pudo guardar la revisión." }, { status: 500 });
  await sb.from("market_supplier_audits").insert({ offer_id: offer.id, previous_observation_id: previous?.id ?? null, current_observation_id: observation.id, severity, diffs, blocks_purchase: blocksPurchase });
  await sb.from("market_supplier_offers").update({ source_price: after.price, availability: after.available === true ? "available" : after.available === false ? "unavailable" : "unknown", last_checked_at: new Date().toISOString(), valid_until: blocksPurchase ? null : new Date(Date.now() + 86400000).toISOString(), status: blocksPurchase ? "blocked" : "approved" }).eq("id", offer.id);
  if (blocksPurchase) {
    await sb.from("market_products").update({ purchasable: false }).eq("id", offer.product_id);
    await sb.from("market_public_catalog").update({ available: false, valid_until: null }).eq("product_id", offer.product_id);
  } else {
    await sb.from("market_public_catalog").update({ price_usd: Number((after.price * 1.15).toFixed(2)), source_checked_at: new Date().toISOString(), valid_until: new Date(Date.now() + 86400000).toISOString(), available: true }).eq("product_id", offer.product_id);
  }
  return NextResponse.json({ ok: true, severity, blocksPurchase, price: extracted.price, available: extracted.available, diffs });
}
