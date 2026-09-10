import Calculator from "@/components/Calculator";
import UpdatedAtNote from "@/components/UpdatedAtNote";

export default function Home() {
  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 3 L18 12 L2 21 Z" fill="#C89B3C" />
          </svg>
          <div className="brand-text">
            <span className="brand-name">Cuyana</span>
            <span className="brand-tagline">Guyana &rarr; Cuba</span>
          </div>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>
            Empiezas a contarlo
            <br />
            y ya llegó.
          </h1>
          <p className="sub">
            Calcula cuánto recibe tu familia y pide tu envío por WhatsApp, sin formularios ni
            esperas.
          </p>
        </div>

        <Calculator />
      </section>

      <section className="trust">
        <div className="item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
          <p>Minutos, no días</p>
        </div>
        <div className="item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <p>Tasa clara, sin sorpresas</p>
        </div>
      </section>

      <section className="how">
        <h2>Cómo funciona</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <p>Calculas cuánto recibe tu familia con la tasa de hoy.</p>
          </div>
          <div className="step">
            <div className="n">02</div>
            <p>Confirmas el envío por WhatsApp, sin crear cuenta.</p>
          </div>
          <div className="step">
            <div className="n">03</div>
            <p>Tu familia recibe el dinero en su zona.</p>
          </div>
        </div>
      </section>

      <footer>
        <p>
          <UpdatedAtNote />
        </p>
        <p>Cuyana © 2026 — Guyana ↔ Cuba</p>
      </footer>
    </div>
  );
}
