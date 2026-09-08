import RatePill from "@/components/RatePill";
import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 20C6 20 14 12 20 12C26 12 34 20 34 20C34 20 26 28 20 28C14 28 6 20 6 20Z"
              stroke="#6E1423"
              strokeWidth="2.4"
              fill="none"
            />
            <path d="M20 12C20 12 24 20 20 28" stroke="#C89B3C" strokeWidth="2.4" />
          </svg>
          <span>Cuyana</span>
        </div>
        <RatePill />
      </header>

      <section className="hero">
        <div>
          <h1>
            Empiezas a contarlo
            <br />
            y ya llegó.
          </h1>
          <p className="sub">
            Remesas de Guyana a Cuba con gente real detrás. Calcula cuánto recibe tu familia y
            pide tu envío por WhatsApp, sin formularios ni esperas.
          </p>
        </div>

        <Calculator />
      </section>

      <section className="trust">
        <div className="item">
          <p>Minutos, no días</p>
        </div>
        <div className="item">
          <p>Tasa clara, sin sorpresas</p>
        </div>
        <div className="item">
          <p>Entrega en toda Cuba</p>
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
        <p>Tasa actualizada hoy, 09:41.</p>
        <p>Cuyana © 2026 — Guyana ↔ Cuba</p>
      </footer>
    </div>
  );
}
