import type { Metadata } from "next";
import { getCatalogProvider } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import ProductCard from "@/components/store/ProductCard";
import CatalogEmptyState from "@/components/store/CatalogEmptyState";
import Volver from "@/components/store/Volver";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alimentos",
  description: "Combos y productos esenciales para tu familia en La Habana, con precios en GYD.",
  alternates: { canonical: "/tienda/alimentos" },
};

const FEATURED_COMBOS = ["combo-basicos-de-casa", "combo-proteina-familiar", "combo-proteina-mixta", "combo-carnes-aceite"];

export default async function AlimentosPage() {
  const provider = getCatalogProvider();
  const [result, rate] = await Promise.all([provider.listByCategory("alimentos"), provider.getCommercialRate()]);
  const bySlug = new Map(result.products.map((product) => [product.slug, product]));
  // Los cuatro destacados primero, y DETRÁS todos los demás combos.
  //
  // Antes esta lista era la única puerta a los combos y los que no estaban en
  // ella desaparecían: no salían aquí por no estar destacados, y tampoco en
  // «Completa la compra», que filtra los que no son combo. `combo-kiosko`
  // llevaba publicado desde ayer, a 194 USD, y no había forma de llegar a él
  // salvo escribiendo la dirección a mano.
  const destacados = FEATURED_COMBOS.flatMap((slug) => (bySlug.get(slug) ? [bySlug.get(slug)!] : []));
  const restoDeCombos = result.products.filter(
    (product) => product.kind === "bundle" && !FEATURED_COMBOS.includes(product.slug),
  );
  const combos = [...destacados, ...restoDeCombos];
  const essentials = result.products.filter((product) => product.kind !== "bundle");
  const supportUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola CUYANA, necesito ayuda para elegir una compra para mi familia.")}`;

  return (
    <main>
      <section className="wrap page-section food-hero">
        <Volver href="/tienda">Tienda</Volver>
        <h1 className="page-title">Compra para tu familia en Cuba</h1>
        <p className="page-lead">Elige un combo o añade productos. Confirmamos disponibilidad y coordinamos la entrega en La Habana.</p>
      </section>

      {result.status === "error" || result.status === "not_configured" ? <div className="wrap"><CatalogEmptyState categoria="alimentos" /></div> : <>
        <section className="wrap store-section" aria-labelledby="combos-title">
          <div className="store-section-heading"><h2 id="combos-title">Combos listos</h2></div>
          <div className="product-grid food-featured-grid">{combos.map((product) => <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />)}</div>
        </section>

        {essentials.length > 0 && <section className="wrap store-section" aria-labelledby="essentials-title"><div className="store-section-heading"><h2 id="essentials-title">Completa la compra</h2></div><div className="product-grid">{essentials.map((product) => <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />)}</div></section>}
      </>}

      <section className="food-process"><div className="wrap"><div className="store-section-heading"><h2>Así funciona</h2></div><ol><li><strong>Elige</strong><span>Escoge y añade.</span></li><li><strong>Confirmamos</strong><span>Revisamos precio y disponibilidad.</span></li><li><strong>Entregamos</strong><span>Coordinamos la entrega.</span></li></ol><p className="food-process-note">Nada se sustituye sin tu aprobación.</p></div></section>

      <section className="wrap store-section food-faq"><h2>Preguntas frecuentes</h2><details><summary>¿Qué pasa si algo no está disponible?</summary><p>Te avisamos y te proponemos una alternativa antes de hacer cualquier cambio.</p></details><details><summary>¿Cuánto tarda la entrega?</summary><p>Cada producto muestra un tiempo estimado. Confirmamos el plazo antes de comprar.</p></details><details><summary>¿Dónde entregan?</summary><p>Este piloto comienza en La Habana. La mensajería depende del municipio.</p></details></section>

      <section className="wrap food-support"><div><h2>¿Necesitas ayuda?</h2><p>Te ayudamos a elegir.</p></div><div className="food-support-actions"><a className="cta" href={supportUrl} target="_blank" rel="noopener">Hablar por WhatsApp</a></div></section>
    </main>
  );
}
