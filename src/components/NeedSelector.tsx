"use client";

import Link from "next/link";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

const NEEDS = [
  {
    href: "#remesas",
    need: "dinero",
    title: "Enviar dinero",
    description: "Calcula cuánto recibe tu familia y pide tu envío por WhatsApp.",
    icon: (
      <path d="M12 3v18M17 7.5c0-2-2.2-3.5-5-3.5S7 5.5 7 7.5 9.2 11 12 11s5 1.5 5 3.5-2.2 3.5-5 3.5-5-1.5-5-3.5" />
    ),
  },
  {
    href: "/tienda/alimentos",
    need: "alimentos",
    title: "Enviar alimentos",
    description: "Elige combos de alimentos para que tu familia los reciba en Cuba.",
    icon: <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8M4 12c0 3 3 5 8 5M4 12h16" />,
  },
  {
    href: "/tienda/energia",
    need: "energia",
    title: "Enviar energía",
    description: "Descubre soluciones de energía solar para el hogar.",
    icon: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  },
];

export default function NeedSelector() {
  return (
    <section className="need-selector" aria-label="Elige qué quieres enviar">
      <div className="wrap">
        <div className="need-grid">
          {NEEDS.map((need) => (
            <Link
              key={need.href}
              href={need.href}
              className="need-card"
              onClick={() => track(ANALYTICS_EVENTS.needSelected, { need: need.need })}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {need.icon}
              </svg>
              <span className="need-title">{need.title}</span>
              <span className="need-desc">{need.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
