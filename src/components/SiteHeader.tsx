"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { NAV_LINKS } from "@/lib/config/site";
import { useCuenta } from "@/lib/cuenta";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, cargando } = useCuenta();
  // Mientras no se sepa si hay sesión no se enseña ninguna de las dos: poner
  // «Entrar» y cambiarlo a «Mi cuenta» medio segundo después es un parpadeo
  // que hace dudar de si se cerró la sesión sola. Va en la navegación y no
  // junto al carrito: en un móvil de 375px esa fila ya va justa, y la acción
  // principal sigue siendo enviar dinero, no registrarse.
  const cuenta = cargando ? null : user ? { href: "/cuenta", texto: "Mi cuenta" } : { href: "/entrar", texto: "Entrar" };

  return (
    <header className="site-header">
      <div className="wrap site-header-row">
        <Link href="/" className="site-logo" aria-label="Curuguay — inicio" onClick={() => setOpen(false)}>
          <Logo variant="header" height={34} />
        </Link>

        <nav className="site-nav-desktop" aria-label="Principal">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          {cuenta && (
            <Link href={cuenta.href} className="site-cuenta">
              {cuenta.texto}
            </Link>
          )}
        </nav>

        <div className="site-header-actions">
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
          {cuenta && (
            <Link href={cuenta.href} onClick={() => setOpen(false)}>
              {cuenta.texto}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
