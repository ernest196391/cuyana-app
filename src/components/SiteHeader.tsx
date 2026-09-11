"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { NAV_LINKS } from "@/lib/config/site";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="wrap site-header-row">
        <Link href="/" className="site-logo" aria-label="Cuyana — inicio" onClick={() => setOpen(false)}>
          <Logo variant="horizontal" height={30} />
        </Link>

        <nav className="site-nav-desktop" aria-label="Principal">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header-actions">
          <Link href="/enviar-dinero" className="site-cta-header">
            Empezar
          </Link>
          <button
            type="button"
            className="site-menu-btn"
            aria-expanded={open}
            aria-controls="site-menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menú</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="site-menu-movil" className="site-nav-movil" aria-label="Principal móvil">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/enviar-dinero" className="site-cta-header site-cta-header-movil" onClick={() => setOpen(false)}>
            Empezar
          </Link>
        </nav>
      )}
    </header>
  );
}
