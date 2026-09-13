import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { calculateCommercialQuote } from "@/lib/supply/pricing";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!token) return NextResponse.json({ error: "Hace falta sesión." }, { status: 401 });
  const sb = createClient(URL, KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: admin } = await sb.rpc("es_admin");
  if (admin !== true) return NextResponse.json({ error: "Esta cuenta no administra el sitio." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!UUID.test(body.orderId ?? "") || !UUID.test(body.offerId ?? "")) return NextResponse.json({ error: "Pedido u oferta inválidos." }, { status: 400 });
  const costs = [body.supplierCost, body.supplierShipping, body.paymentFxFee, body.unavoidableLogistics].map(Number);
  if (costs.some((n) => !Number.isFinite(n) || n < 0)) return NextResponse.json({ error: "Revisa los importes." }, { status: 400 });
  const { data: offer } = await sb.from("market_supplier_offers").select("id,source_url,product_id,currency,presentation,composition,destination_scope,eta_text,last_checked_at,valid_until,status").eq("id", body.offerId).maybeSingle();
  if (!offer || offer.status !== "approved" || !offer.valid_until || new Date(offer.valid_until) <= new Date()) return NextResponse.json({ error: "La oferta debe estar aprobada y vigente antes de comprar." }, { status: 409 });
  const { data: order } = await sb.from("store_orders").select("id,total_usd,status,recipient_name,recipient_province,recipient_municipality").eq("id", body.orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  const quote = calculateCommercialQuote({ supplierPrice: costs[0], supplierShipping: costs[1], paymentFxFee: costs[2], unavoidableLogistics: costs[3], gydPerUsd: Number(body.gydPerUsd) || null });
  const snapshot = { version: 1, order, offer, costs: { supplierCost: costs[0], supplierShipping: costs[1], paymentFxFee: costs[2], unavoidableLogistics: costs[3] }, quote, confirmedByOperator: true };
  const { data, error } = await sb.from("market_order_supply_snapshots").insert({ store_order_id: order.id, supplier_offer_id: offer.id, source_url: offer.source_url, fulfillment_mode: body.fulfillmentMode === "via_cuyana_hub" ? "via_cuyana_hub" : "direct_to_recipient", supplier_cost: costs[0], supplier_shipping: costs[1], payment_fx_fee: costs[2], unavoidable_logistics: costs[3], landed_cost: quote.landedCostUsd, markup_rate: .15, sale_price_usd: quote.salePriceUsd, commercial_rate_gyd_per_usd: Number(body.gydPerUsd) || null, sale_price_gyd: quote.salePriceGyd, ernesto_share: quote.ernestoShareUsd, adonys_share: quote.adonysShareUsd, cuyana_share: quote.cuyanaShareUsd, purchased_at: new Date().toISOString(), snapshot }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "No se pudo registrar la compra." }, { status: 500 });
  return NextResponse.json({ ok: true, snapshotId: data.id, quote });
}
