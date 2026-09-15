import Link from "next/link";

/**
 * El botón de volver de la tienda.
 *
 * Hasta ahora, para retroceder desde un producto había que rehacer el camino
 * desde `/tienda`. El botón del navegador existe, sí, pero en una web metida
 * en la pantalla de inicio del teléfono —que es como se usa esto— no hay
 * barra de navegador que valga.
 *
 * Es un enlace a un sitio concreto y no un `history.back()` a propósito: el
 * historial no siempre viene de donde uno cree. Quien llega a un producto
 * desde un enlace de WhatsApp no tiene «atrás» ninguno, y con `history.back()`
 * el botón no haría nada o lo sacaría de la web. Un enlace siempre lleva al
 * mismo sitio, venga de donde venga.
 */
export default function Volver({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="volver">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}
