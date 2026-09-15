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

type CommercialRate = { gyd_per_usd: number; source: string; as_of: string; expires_at: string | null };

export default function AbastecimientoPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [costs, setCosts] = useState({ shipping: "0", fee: "0", logistics: "0", rate: "" });
  const [notice, setNotice] = useState("");
  const [rate, setRate] = useState<CommercialRate | null>(null);
  const [rateValue, setRateValue] = useState("245");
  const [savingRate, setSavingRate] = useState(false);
  const [renovando, setRenovando] = useState(false);
  const [progreso, setProgreso] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data, error: queryError }, { data: rateData }] = await Promise.all([supabase!.from("market_supplier_offers").select("id,source_url,source_price,supplier_shipping,availability,eta_text,last_checked_at,valid_until,status,is_primary,market_products(name,presentation),market_suppliers(name)").order("is_primary", { ascending: false }).order("updated_at", { ascending: false }), supabase!.from("commercial_rates").select("gyd_per_usd,source,as_of,expires_at").eq("id", "gyd_usd").maybeSingle()]);
      if (!active) return;
      if (queryError) setError("No se pudo cargar el abastecimiento.");
      else setOffers((data ?? []) as unknown as Offer[]);
      if (rateData) { const current = rateData as CommercialRate; setRate(current); setRateValue(String(current.gyd_per_usd)); }
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

  /**
   * Renovar la vigencia de todo el catálogo.
   *
   * Llama a la ruta por tandas y vuelve a llamar mientras queden ofertas. Se
   * hace así, y no de una sola vez, porque cada oferta abre la web de su
   * proveedor: todas juntas se pasarían del tiempo que Vercel da a una
   * función y se cortaría por la mitad sin saber qué quedó hecho.
   *
   * El tope de vueltas evita que un error del servidor que siempre devuelva
   * «quedan: 34» deje el navegador dando vueltas para siempre.
   */
  async function renovarTodo() {
    if (!supabase) return;
    setRenovando(true);
    setError("");
    let renovadas = 0, bloqueadas = 0, sinFicha = 0, vueltas = 0;
    try {
      for (;;) {
        vueltas += 1;
        if (vueltas > 40) { setError("La renovación dio demasiadas vueltas. Recarga y mira qué quedó."); break; }
        const { data } = await supabase.auth.getSession();
        const response = await fetch("/api/admin/supply/revalidate-todo", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
          body: JSON.stringify({}),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) { setError(result.error ?? "No se pudo renovar el catálogo."); break; }
        renovadas += result.renovadas ?? 0;
        bloqueadas += result.bloqueadas ?? 0;
        sinFicha += result.fichasSinActualizar ?? 0;
        setProgreso(`${renovadas} renovadas, ${bloqueadas} bloqueadas · quedan ${result.quedan}`);
        if (!result.quedan || !result.procesadas) break;
      }
    } finally {
      setRenovando(false);
    }
    setNotice(`Catálogo renovado: ${renovadas} con precio al día, ${bloqueadas} bloqueadas por no poder leer al proveedor.`);
    // Que la tienda no refleje lo que dice el panel es peor que un error: todo
    // parece bien y nadie mira. Se enseña como error, no como aviso de paso.
    if (sinFicha > 0) {
      setError(`OJO: ${sinFicha} ofertas se revisaron pero su ficha de tienda no se pudo actualizar. La tienda no va a reflejar esto.`);
    }
    window.setTimeout(() => window.location.reload(), 1500);
  }

  async function saveRate() {
    if (!supabase) return;
    const value = Number(rateValue);
    if (!Number.isFinite(value) || value <= 0) { setError("La tasa debe ser mayor que cero."); return; }
    setSavingRate(true); setError(""); setNotice("");
    const now = new Date(); const expires = new Date(now.getTime() + 7 * 86400000);
    const { error: updateError } = await supabase.from("commercial_rates").upsert({ id: "gyd_usd", gyd_per_usd: value, source: "Referencia comercial operativa CUYANA", as_of: now.toISOString(), expires_at: expires.toISOString(), updated_by: "panel_admin", updated_at: now.toISOString() });
    setSavingRate(false);
    if (updateError) setError("No se pudo actualizar la tasa comercial.");
    else { setRate({ gyd_per_usd: value, source: "Referencia comercial operativa CUYANA", as_of: now.toISOString(), expires_at: expires.toISOString() }); setNotice("Tasa comercial actualizada por 7 días."); }
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
  const vencidas = offers.filter((o) => !o.valid_until || new Date(o.valid_until).getTime() <= Date.now()).length;
  const rateExpiresAt = rate?.expires_at ? new Date(rate.expires_at).getTime() : 0;
  const rateState = !rate || rateExpiresAt <= Date.now() ? "vencida" : rateExpiresAt - Date.now() <= 86400000 ? "por vencer" : "vigente";
  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><p className="admin-eyebrow">CUYANA Market</p><h1>Abastecimiento</h1><p>Compra externa manual. Abre la fuente y confirma precio, existencia, presentación, destino, entrega y shipping antes de pagar.</p></div></header>
      <div className="supply-warning"><strong>Nunca compres solo por el dato guardado.</strong> La última revisión puede haber vencido.</div>
      {/* Un precio dura 24 h. Cuando vencen todos a la vez, la tienda se queda
          con todo «no disponible» y parece rota — pasó el 15 de septiembre.
          Esto lo dice ANTES de que el cliente se lo encuentre, y lo arregla
          sin tener que pulsar oferta por oferta. */}
      <section className={vencidas > 0 ? "supply-vigencia supply-vigencia-mal" : "supply-vigencia"}>
        <div>
          <h2>Vigencia del catálogo</h2>
          <p>
            {vencidas === 0
              ? `Las ${offers.length} ofertas tienen el precio al día.`
              : `${vencidas} de ${offers.length} ofertas tienen el precio vencido. Los productos que dependen de ellas no se pueden comprar en la tienda.`}
          </p>
          {progreso && <p className="supply-progreso" role="status">{progreso}</p>}
        </div>
        <button className="btn btn-primary" type="button" disabled={renovando || vencidas === 0} onClick={renovarTodo}>
          {renovando ? "Renovando…" : "Renovar todo el catálogo"}
        </button>
      </section>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="supply-success" role="status">{notice}</p>}
      <section className="supply-rate" aria-labelledby="rate-title"><div><p className="admin-eyebrow">PRECIO EN GUYANA</p><h2 id="rate-title">Tasa comercial GYD/USD</h2><p className={`supply-rate-${rateState.replace(" ", "-")}`}><strong>{rateState.toUpperCase()}.</strong> {rate ? `Actualizada ${new Date(rate.as_of).toLocaleString("es")}. Vence ${rate.expires_at ? new Date(rate.expires_at).toLocaleString("es") : "sin fecha"}.` : "No hay una tasa activa."}</p></div><label>GYD por 1 USD<input type="number" min="0.01" step="0.01" value={rateValue} onChange={(event) => setRateValue(event.target.value)} /></label><button className="btn btn-primary" type="button" disabled={savingRate} onClick={saveRate}>{savingRate ? "Guardando…" : "Actualizar 7 días"}</button></section>
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
