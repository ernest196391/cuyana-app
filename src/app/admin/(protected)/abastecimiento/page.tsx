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

  if (loading) return <main className="admin-page"><p>Cargando abastecimiento…</p></main>;
  if (error) return <main className="admin-page"><p className="admin-error">{error}</p></main>;

  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><p className="admin-eyebrow">CUYANA Market</p><h1>Abastecimiento</h1><p>Compra externa manual. Abre la fuente y confirma precio, existencia, presentación, destino, entrega y shipping antes de pagar.</p></div></header>
      <div className="supply-warning"><strong>Nunca compres solo por el dato guardado.</strong> La última revisión puede haber vencido.</div>
      <div className="supply-list">
        {offers.map((offer) => {
          const valid = offer.valid_until ? new Date(offer.valid_until).getTime() > Date.now() : false;
          return <article className="supply-card" key={offer.id}>
            <div className="supply-card-main"><p className="admin-eyebrow">{offer.market_suppliers?.name ?? "Proveedor"}</p><h2>{offer.market_products?.name ?? "Producto"}</h2><p>{offer.market_products?.presentation}</p></div>
            <dl><div><dt>Costo guardado</dt><dd>${Number(offer.source_price).toFixed(2)}</dd></div><div><dt>Estado</dt><dd>{offer.availability}</dd></div><div><dt>Entrega</dt><dd>{offer.eta_text ?? "Por confirmar"}</dd></div><div><dt>Revisión</dt><dd className={valid ? "supply-valid" : "supply-expired"}>{valid ? "Vigente" : "Vencida / pendiente"}</dd></div></dl>
            <a className="btn btn-primary" href={offer.source_url} target="_blank" rel="noreferrer">Abrir y revalidar fuente</a>
          </article>;
        })}
      </div>
    </main>
  );
}
