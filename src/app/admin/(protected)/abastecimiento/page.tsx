"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Offer = {
  id: string;
  source_url: string;
  source_price: number;
  supplier_shipping: number | null;
  availability: string;
  eta_text: string | null;
  last_checked_at: string | null;
  valid_until: string | null;
  status: string;
  is_primary: boolean;
  market_products: { name: string; presentation: string | null } | null;
  market_suppliers: { name: string } | null;
};

export default function AbastecimientoPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [costs, setCosts] = useState({ shipping: "0", fee: "0", logistics: "0", rate: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: queryError } = await supabase!
        .from("market_supplier_offers")
        .select("id,source_url,source_price,supplier_shipping,availability,eta_text,last_checked_at,valid_until,status,is_primary,market_products(name,presentation),market_suppliers(name)")
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false });
      if (!active) return;
      if (queryError) setError("No se pudo cargar el abastecimiento.");
      else setOffers((data ?? []) as unknown as Offer[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  async function revalidate(offerId: string) {
    if (!supabase) return;
    setChecking(offerId);
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/admin/supply/revalidate", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ offerId }) });
    const result = await response.json().catch(() => ({}));
    setChecking(null);
    if (!response.ok) setError(result.error ?? "No se pudo revalidar.");
    else window.location.reload();
  }

  async function registerPurchase(offer: Offer) {
    if (!supabase) return;
    setBuying(offer.id); setError(""); setNotice("");
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/admin/supply/purchase", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ orderId, offerId: offer.id, supplierCost: offer.source_price, supplierShipping: costs.shipping, paymentFxFee: costs.fee, unavoidableLogistics: costs.logistics, gydPerUsd: costs.rate, fulfillmentMode: "direct_to_recipient" }) });
    const result = await response.json().catch(() => ({}));
    setBuying(null);
    if (!response.ok) setError(result.error ?? "No se pudo registrar la compra.");
    else setNotice(`Compra registrada. Snapshot ${result.snapshotId}.`);
  }

  if (loading) return <main className="admin-page"><p>Cargando abastecimiento…</p></main>;
  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><p className="admin-eyebrow">CUYANA Market</p><h1>Abastecimiento</h1><p>Compra externa manual. Abre la fuente y confirma precio, existencia, presentación, destino, entrega y shipping antes de pagar.</p></div></header>
      <div className="supply-warning"><strong>Nunca compres solo por el dato guardado.</strong> La última revisión puede haber vencido.</div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="supply-success" role="status">{notice}</p>}
      <section className="supply-purchase-form" aria-labelledby="purchase-title"><h2 id="purchase-title">Registrar compra ejecutada</h2><p>Introduce el UUID del pedido y los costes reales. Cada tarjeta permite guardar un snapshot financiero inmutable.</p><label>UUID del pedido<input value={orderId} onChange={(event) => setOrderId(event.target.value.trim())} placeholder="00000000-0000-0000-0000-000000000000" /></label><div className="supply-cost-grid"><label>Shipping USD<input type="number" min="0" step="0.01" value={costs.shipping} onChange={(event) => setCosts({ ...costs, shipping: event.target.value })} /></label><label>Comisión FX USD<input type="number" min="0" step="0.01" value={costs.fee} onChange={(event) => setCosts({ ...costs, fee: event.target.value })} /></label><label>Logística USD<input type="number" min="0" step="0.01" value={costs.logistics} onChange={(event) => setCosts({ ...costs, logistics: event.target.value })} /></label><label>Tasa GYD/USD<input type="number" min="0" step="0.01" value={costs.rate} onChange={(event) => setCosts({ ...costs, rate: event.target.value })} /></label></div></section>
      <div className="supply-list">
        {offers.map((offer) => {
          const valid = offer.valid_until ? new Date(offer.valid_until).getTime() > Date.now() : false;
          return <article className="supply-card" key={offer.id}>
            <div className="supply-card-main"><p className="admin-eyebrow">{offer.market_suppliers?.name ?? "Proveedor"}</p><h2>{offer.market_products?.name ?? "Producto"}</h2><p>{offer.market_products?.presentation}</p></div>
            <dl><div><dt>Costo guardado</dt><dd>${Number(offer.source_price).toFixed(2)}</dd></div><div><dt>Estado</dt><dd>{offer.availability}</dd></div><div><dt>Entrega</dt><dd>{offer.eta_text ?? "Por confirmar"}</dd></div><div><dt>Revisión</dt><dd className={valid ? "supply-valid" : "supply-expired"}>{valid ? "Vigente" : "Vencida / pendiente"}</dd></div></dl>
            <div className="supply-actions"><a className="btn btn-outline" href={offer.source_url} target="_blank" rel="noreferrer">Abrir fuente</a><button className="btn btn-outline" type="button" disabled={checking === offer.id} onClick={() => revalidate(offer.id)}>{checking === offer.id ? "Revisando…" : "Revalidar ahora"}</button><button className="btn btn-primary" type="button" disabled={!valid || !orderId || buying === offer.id} onClick={() => registerPurchase(offer)}>{buying === offer.id ? "Guardando…" : "Registrar compra"}</button></div>
          </article>;
        })}
      </div>
    </main>
  );
}
