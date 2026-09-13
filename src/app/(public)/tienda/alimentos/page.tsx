import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCatalogProvider } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/lib/config/site";
import ProductCard from "@/components/store/ProductCard";
import CatalogEmptyState from "@/components/store/CatalogEmptyState";

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
  const combos = FEATURED_COMBOS.flatMap((slug) => bySlug.get(slug) ? [bySlug.get(slug)!] : []);
  const essentials = result.products.filter((product) => product.kind !== "bundle");
  const supportUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola CUYANA, necesito ayuda para elegir una compra para mi familia.")}`;

  return (
    <main>
      <section className="wrap page-section food-hero">
        <p className="section-eyebrow">ALIMENTOS PARA TU FAMILIA EN CUBA</p>
        <h1 className="page-title">La compra de tu familia, resuelta desde Guyana.</h1>
        <p className="page-lead">Elige un combo o completa la compra con productos esenciales. CUYANA verifica disponibilidad, coordina la entrega en La Habana y te acompaña hasta que llegue a casa.</p>
        <p className="food-delivery-line">Entrega en La Habana · La mensajería se calcula según el municipio antes de confirmar.</p>
      </section>

      {result.status === "error" || result.status === "not_configured" ? <div className="wrap"><CatalogEmptyState categoria="alimentos" /></div> : <>
        <section className="wrap store-section" aria-labelledby="combos-title">
          <div className="store-section-heading"><p className="section-eyebrow">COMBOS CUYANA</p><h2 id="combos-title">Compras listas para resolver de una vez</h2><p>Contenido claro, precio en GYD y entrega estimada antes de añadir al carrito.</p></div>
          <div className="product-grid food-featured-grid">{combos.map((product) => <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />)}</div>
        </section>

        <section className="wrap food-secondary-entry" aria-labelledby="aseo-title"><div className="food-secondary-image"><Image src="/catalog/alimentos/combo-aseo-personal/hero.webp" alt="Productos esenciales de higiene personal" fill sizes="160px" /></div><div><p className="section-eyebrow">PRÓXIMAMENTE</p><h2 id="aseo-title">Aseo para la casa</h2><p>Una compra práctica con productos esenciales de higiene personal.</p></div></section>

        <section className="wrap food-guided" aria-label="Próximas formas de comprar"><article><p className="section-eyebrow">PRÓXIMAMENTE</p><h2>Arma tu combo</h2><p>Combina productos y cantidades según lo que necesita tu familia.</p></article><article><p className="section-eyebrow">PRÓXIMAMENTE</p><h2>Compra según tu presupuesto</h2><p>Dinos cuánto quieres gastar y te propondremos una compra equilibrada.</p></article></section>

        {essentials.length > 0 && <section className="wrap store-section" aria-labelledby="essentials-title"><div className="store-section-heading"><p className="section-eyebrow">PARA COMPLETAR</p><h2 id="essentials-title">Añade lo que haga falta</h2></div><div className="product-grid">{essentials.map((product) => <ProductCard key={product.slug} product={product} gydPerUsd={rate?.gydPerUsd ?? null} />)}</div></section>}
      </>}

      <section className="food-process"><div className="wrap"><div className="store-section-heading"><p className="section-eyebrow">ASÍ FUNCIONA</p><h2>CUYANA se ocupa de la compra hasta la entrega</h2></div><ol><li><strong>ELIGES</strong><span>Escoge un combo o añade productos. Ves el precio en GYD antes de continuar.</span></li><li><strong>VERIFICAMOS</strong><span>Antes de comprar, revalidamos precio, disponibilidad y presentación con el proveedor.</span></li><li><strong>COORDINAMOS LA ENTREGA</strong><span>Calculamos la mensajería según el municipio y acompañamos el pedido hasta la entrega.</span></li></ol><p className="food-process-note">Si algo cambia, te avisamos antes de sustituirlo. Nada se cambia sin tu confirmación.</p></div></section>

      <section className="wrap store-section food-faq"><h2>Preguntas frecuentes</h2><details><summary>¿CUYANA tiene estos productos en inventario?</summary><p>Trabajamos bajo pedido con proveedores verificados. Antes de ejecutar tu compra revalidamos precio, disponibilidad y presentación.</p></details><details><summary>¿Qué pasa si falta un producto o cambia una marca?</summary><p>Te proponemos una alternativa equivalente o superior. Solo hacemos el cambio cuando tú lo confirmas.</p></details><details><summary>¿Cuánto tarda la entrega?</summary><p>Cada producto muestra una entrega estimada. El plazo definitivo depende de la disponibilidad del proveedor y del municipio de entrega; lo confirmamos antes de ejecutar la compra.</p></details><details><summary>¿Dónde entregan?</summary><p>Este piloto comienza en La Habana. La mensajería se calcula según el municipio y se suma antes de confirmar el pedido.</p></details></section>

      <section className="wrap food-support"><div><h2>¿Prefieres que te ayudemos a elegir?</h2><p>Dinos para quién es la compra y cuánto quieres gastar. Te orientamos con una opción clara antes de confirmar el pedido.</p></div><div className="food-support-actions"><a className="cta" href={supportUrl} target="_blank" rel="noopener">Hablar con CUYANA</a><Link className="btn-secondary" href="/ayuda">Ver ayuda</Link></div></section>
    </main>
  );
}
