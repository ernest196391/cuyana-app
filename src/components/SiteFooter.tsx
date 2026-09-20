import Link from "next/link";
import Logo from "./Logo";
import { FOOTER_LEGAL_LINKS, WHATSAPP_NUMBER } from "@/lib/config/site";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-grid">
        <div className="site-footer-brand">
          <Logo variant="symbol" height={30} />
        </div>

        <nav className="site-footer-nav" aria-label="Legal y ayuda">
          {FOOTER_LEGAL_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener">
            WhatsApp
          </a>
        </nav>
      </div>
      <div className="wrap">
        <p className="site-footer-copy">Curuguay © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
