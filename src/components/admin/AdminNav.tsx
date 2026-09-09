"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TABS = [
  {
    href: "/admin",
    label: "Tasa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M8.5 7h5a2.5 2.5 0 0 1 0 5h-3a2.5 2.5 0 0 0 0 5h5.5" />
      </svg>
    ),
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/admin/referidos",
    label: "Referidos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="18" cy="18" r="2.2" />
        <path d="M8 11l8-4M8 13l8 4" />
      </svg>
    ),
  },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <>
      <div className="admin-topbar">
        <span className="admin-topbar-email">{email}</span>
        <button className="admin-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      <nav className="admin-tabbar" aria-label="Navegación del panel">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-tab${pathname === tab.href ? " active" : ""}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
