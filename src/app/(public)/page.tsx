import Image from "next/image";
import Link from "next/link";
import Calculator from "@/components/Calculator";
import UpdatedAtNote from "@/components/UpdatedAtNote";
import NeedSelector from "@/components/NeedSelector";
import { getCatalogProvider } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/lib/config/site";

export default async function Home() {
  const provider = getCatalogProvider();
  const [alimentos, energia] = await Promise.all([
    provider.listByCategory("alimentos"),
    provider.listByCategory("energia"),
  ]);
  const alimentosDisponible = alimentos.status === "ok" && alimentos.products.length > 0;
  const energiaDisponible = energia.status === "ok" && energia.products.length > 0;

  return (
    <div className="wrap">
      {/* Hero: en móvil el orden es texto → CTA → imagen (ver globals.css) */}
      <section className="hero">
        <div className="hero-copy">
          <h1>Cerca de los tuyos.</h1>
          <p className="sub">
            Envía dinero o compra para tu familia en Cuba desde Guyana, con el total claro antes
            de continuar.
          </p>
          <div className="hero-ctas">
            <a href="#remesas" className="cta cta-inline">
              Enviar dinero
            </a>
            <Link href="/tienda" className="cta cta-secondary cta-inline">
              Ver tienda
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <Image
            src="/brand/cuyana/campaign/cuyana-familia-abrazo-hero.webp"
            alt="Mujer joven abrazando a una adulta mayor en un hogar cubano"
            width={1672}
            height={941}
            priority
            sizes="(max-width: 860px) 100vw, 50vw"
          />
        </div>
      </section>

      <NeedSelector />

      {/* ---------- Remesas ---------- */}
      <section id="remesas" className="section-remesas">
        <div className="section-remesas-media">
          <Image
            src="/brand/cuyana/campaign/cuyana-remitente-guyana.webp"
            alt="Joven consulta su teléfono en una calle comercial en Guyana"
            width={1122}
            height={1402}
            loading="lazy"
            sizes="(max-width: 860px) 100vw, 30vw"
          />
          <Image
            src="/brand/cuyana/campaign/cuyana-receptora-whatsapp.webp"
            alt="Mujer cubana sonríe mientras lee un mensaje en su teléfono"
            width={1122}
            height={1402}
            loading="lazy"
            className="section-remesas-media-second"
            sizes="30vw"
          />
        </div>
        <div className="section-remesas-calc">
          <h2>Enviar dinero</h2>
          <p className="section-lead">Calcula cuánto recibe tu familia y confirma por WhatsApp.</p>
          <Calculator />
        </div>
      </section>

      {/* ---------- Alimentos ---------- */}
      <section id="alimentos" className="need-section">
        <div className="need-section-media">
          <Image
            src="/brand/cuyana/campaign/cuyana-familia-comida.webp"
            alt="Tres generaciones comparten alimentos en una mesa familiar"
            width={1254}
            height={1254}
            loading="lazy"
            sizes="(max-width: 860px) 100vw, 40vw"
          />
        </div>
        <div className="need-section-copy">
          <h2>Alimentos para compartir en familia</h2>
          {alimentosDisponible ? (
            <p className="section-lead">Combos de alimentos listos para pedir hoy.</p>
          ) : (
            <p className="section-lead">
              Catálogo en preparación. Escríbenos por WhatsApp y te contamos qué hay disponible.
            </p>
          )}
          <Link href="/tienda/alimentos" className="cta cta-inline">
            Ver alimentos
          </Link>
        </div>
      </section>

      {/* ---------- Energía ---------- */}
      <section id="energia" className="need-section need-section-reverse">
        <div className="need-section-media">
          <Image
            src="/brand/cuyana/campaign/cuyana-energia-solar-hero.webp"
            alt="Panel solar y estación de energía en un patio cubano"
            width={1672}
            height={941}
            loading="lazy"
            sizes="(max-width: 860px) 100vw, 40vw"
          />
        </div>
        <div className="need-section-copy">
          <h2>Energía para el hogar</h2>
          {energiaDisponible ? (
            <p className="section-lead">Soluciones de energía solar disponibles hoy.</p>
          ) : (
            <p className="section-lead">
              Catálogo en preparación. Escríbenos por WhatsApp y te contamos qué hay disponible.
            </p>
          )}
          <Link href="/tienda/energia" className="cta cta-inline">
            Ver soluciones de energía
          </Link>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="how">
        <h2>Cómo funciona</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <p>Eliges qué enviar: dinero, alimentos o energía.</p>
          </div>
          <div className="step">
            <div className="n">02</div>
            <p>Confirmas el total y la disponibilidad antes de continuar.</p>
          </div>
          <div className="step">
            <div className="n">03</div>
            <p>Recibes seguimiento por WhatsApp hasta que llega a tu familia.</p>
          </div>
        </div>
      </section>

      {/* ---------- Confianza y ayuda ---------- */}
      <section className="trust">
        <div className="item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
          <p>
            <UpdatedAtNote />
          </p>
        </div>
        <div className="item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <p>Métodos y zonas confirmados en la calculadora antes de enviar.</p>
        </div>
        <div className="item">
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener" className="item-link">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.29-1.39a9.9 9.9 0 0 0 4.7 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.07c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.41.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.26 1.63 2.04 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.21.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.15.48.22.55.34.07.13.07.72-.17 1.4z" />
            </svg>
            <p>¿Dudas? Escríbenos por WhatsApp.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
