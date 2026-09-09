"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/useAdminAuth";

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
    setSubmitting(false);
    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.replace("/admin");
  }

  if (loading || user) {
    return <div className="admin-loading">Cargando…</div>;
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 3 L18 12 L2 21 Z" fill="#C89B3C" />
          </svg>
          <span>Cuyana</span>
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
