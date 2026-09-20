import Image from "next/image";
import Link from "next/link";
import CuruguayCalculator from "@/components/CuruguayCalculator";
import { WHATSAPP_NUMBER } from "@/lib/config/site";

export default function Home() {
  return (
    <main>
      <section className="curu-hero"><div className="wrap curu-hero-grid">
        <div className="curu-hero-copy"><span className="curu-kicker">Remesas de Uruguay a Cuba</span><h1>Cerca, aunque estén lejos.</h1><p>Calcula cuánto recibe tu familia y confirma cada detalle antes de enviar.</p><div className="curu-actions"><a href="#calculadora" className="curu-btn curu-btn-primary">Calcular remesa</a><Link href="/envio/consultar" className="curu-btn curu-btn-secondary">Dar seguimiento</Link></div><ul className="curu-proof" aria-label="Ventajas"><li>Tasa clara</li><li>Seguimiento</li><li>Atención humana</li></ul></div>
        <div className="curu-hero-media"><Image src="/campaign/curuguay-hero-mobile.webp" alt="Mujer consultando una remesa desde su teléfono" fill priority sizes="(max-width: 860px) 100vw, 48vw" /><div className="curu-floating-card"><span>Uruguay</span><b>→</b><span>Cuba</span></div></div>
      </div></section>
      <section className="wrap curu-calculator-section"><div className="curu-section-copy"><span className="curu-kicker">Sin sorpresas</span><h2>Sabes cuánto entregas y cuánto recibe tu familia.</h2><p>Elige pesos uruguayos o dólares y la forma de entrega en Cuba. Antes de pagar, nuestro equipo confirma la tasa y disponibilidad.</p></div><CuruguayCalculator /></section>
      <section id="como-funciona" className="curu-how"><div className="wrap"><span className="curu-kicker">Simple de principio a fin</span><h2>Así funciona</h2><div className="curu-steps"><article><b>01</b><h3>Calcula</h3><p>Elige cómo pagas en Uruguay y cómo recibe tu familia en Cuba.</p></article><article><b>02</b><h3>Confirma</h3><p>Recibes por WhatsApp la tasa vigente y los datos para completar el pago.</p></article><article><b>03</b><h3>Sigue</h3><p>Consulta el estado con tu referencia hasta confirmar la entrega.</p></article></div></div></section>
      <section id="seguimiento" className="wrap curu-track"><div><span className="curu-kicker">Tu envío, visible</span><h2>Seguimiento para ti y tu familia.</h2><p>Cada operación recibe una referencia compartible y un comprobante preparado para WhatsApp.</p></div><Link href="/envio/consultar" className="curu-btn curu-btn-secondary">Consultar un envío</Link></section>
      <section className="curu-final"><div className="wrap"><h2>¿Quieres enviar apoyo a Cuba?</h2><p>Calcula primero. Confirma después.</p><a className="curu-btn curu-btn-light" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">Hablar por WhatsApp</a></div></section>
    </main>
  );
}
