import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogProvider } from "@/lib/catalog";
import ProductCard from "@/components/store/ProductCard";
import CatalogEmptyState from "@/components/store/CatalogEmptyState";

// Mismo motivo que /tienda/energia: catálogo y tasa comercial en vivo, sin
// congelar la página como HTML estático del momento del build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alimentos",
  description: "Combos de alimentos para enviar a tu familia en Cuba.",
  alternates: { canonical: "/tienda/alimentos" },
};

export default async function AlimentosPage() {
  const provider = getCatalogProvider();
  const [result, rate] = await Promise.all([provider.listByCategory("alimentos"), provider.getCommercialRate()]);
  const combos = result.products.filter((product) => product.kind === "bundle").slice(0, 4);
  const essentials = result.products.filter((product) => product.kind !== "bundle");

  return (
    <main className="food-market">
      <section className="wrap food-hero">
        <p className="food-eyebrow">De Guyana a su casa en Cuba</p>
        <h1 className="page-title">Resuelve la compra de tu familia</h1>
        <p className="page-lead">Elige una compra clara, dinos quién la recibe y CUYANA coordina la entrega en La Habana.</p>
        <div className="food-destination-note">📍 La dirección y la mensajería se confirman en el carrito.</div>
      </section>

      {result.status === "error" || result.status === "not_configured" ? (
        <div className="wrap"><CatalogEmptyState categoria="alimentos" /></div>
      ) : (
        <>
          <section className="wrap food-section" aria-labelledby="combos-title">
            <div className="food-section-heading">
              <div><p className="food-eyebrow">Compras listas</p><h2 id="combos-title">Combos recomendados</h2></div>
              <p>Sabes qué incluye y cuánto cuesta antes de pedir.</p>
            </div>
            <div className="product-grid food-combo-grid">
              {combos.map((product) => <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />)}
            </div>
          </section>

          <section className="wrap food-guided-grid" aria-label="Próximas formas de comprar">
            <article><span>🧺</span><div><h2>Arma tu combo</h2><p>Escoge productos y cantidades a tu manera.</p><span className="badge badge-warning">Próximamente</span></div></article>
            <article><span>💛</span><div><h2>Dime cuánto quieres gastar</h2><p>Prepararemos una compra equilibrada según tu presupuesto.</p><span className="badge badge-warning">Próximamente</span></div></article>
          </section>

          {essentials.length > 0 && <section className="wrap food-section" aria-labelledby="essentials-title">
            <div className="food-section-heading"><div><p className="food-eyebrow">Para completar</p><h2 id="essentials-title">Productos esenciales</h2></div></div>
            <div className="product-grid">{essentials.map((product) => <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />)}</div>
          </section>}
        </>
      )}

      <section className="food-how"><div className="wrap"><p className="food-eyebrow">Así funciona</p><h2>CUYANA responde por tu pedido</h2><div className="food-how-grid"><p><strong>1. Eliges</strong><br />Revisas contenido, precio y disponibilidad.</p><p><strong>2. Confirmamos</strong><br />Verificamos la compra y cualquier sustitución contigo.</p><p><strong>3. Entregamos</strong><br />Coordinamos la llegada a casa de tu familiar.</p></div><p className="food-smallprint">Si una marca cambia, nunca la sustituimos en silencio. La mensajería depende del municipio y se suma en el carrito.</p></div></section>

      <section className="wrap food-section food-faq"><h2>Preguntas frecuentes</h2><details><summary>¿Los productos están en inventario de CUYANA?</summary><p>Trabajamos bajo pedido. Verificamos disponibilidad antes de ejecutar la compra.</p></details><details><summary>¿Qué ocurre si falta una marca?</summary><p>Te proponemos una alternativa equivalente y esperamos tu confirmación.</p></details><details><summary>¿Puedo enviar a cualquier provincia?</summary><p>Este piloto comienza en La Habana. Ampliaremos cobertura de forma gradual.</p></details><Link className="btn btn-outline" href="/ayuda">Necesito ayuda</Link></section>
    </main>
  );
}
