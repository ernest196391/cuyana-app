"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdminAuth, esAdministrador } from "@/lib/useAdminAuth";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      setError("Email o contraseña incorrectos.");
      return;
    }
    // La contraseña era buena, pero esta puerta no es la suya: con cuentas de
    // cliente en la misma web, un cliente puede entrar aquí sin querer. Se le
    // dice adónde ir en vez de dejarlo mirando un formulario que se limpia
    // solo, y se cierra la sesión para no dejarlo a medias entre las dos.
    if (!(await esAdministrador())) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("Esa cuenta no administra el sitio. Tu cuenta de cliente está en cuyana.casavivadecuba.com/cuenta.");
      return;
    }
    setSubmitting(false);
    router.replace("/admin");
  }

  if (loading || user) {
    return <div className="admin-loading">Cargando…</div>;
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <Logo variant="horizontal" height={24} />
        </div>
        <p className="admin-login-sub">Panel de administración</p>

        <form onSubmit={handleSubmit}>
          <label className="admin-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="admin-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="admin-label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="admin-btn-primary admin-btn-full" type="submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
