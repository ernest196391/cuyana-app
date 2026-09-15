"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

/**
 * «Olvidé la contraseña» del panel.
 *
 * Manda el correo de recuperación y devuelve a `/admin/nueva-clave`, no a la
 * portada. El enlace que manda Supabase lleva a donde le digas aquí; si no se
 * lo dices, va a la Site URL del proyecto y la persona acaba mirando la tienda
 * sin entender qué pasó. Eso es exactamente lo que ocurrió el 15 de
 * septiembre.
 *
 * `location.origin` y no una dirección escrita a mano: así funciona igual en
 * la web de verdad, en una vista previa de Vercel y en local, sin tocar nada.
 *
 * SIEMPRE dice lo mismo, exista la cuenta o no. Si dijera «ese correo no
 * está registrado», cualquiera podría ir probando direcciones hasta descubrir
 * quién administra un sitio que mueve dinero. Es la misma razón por la que el
 * registro de clientes tampoco lo dice.
 */
export default function AdminRecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setEnviando(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/nueva-clave`,
    });

    setEnviando(false);

    // El único error que se enseña es el que la persona puede arreglar: que
    // el correo esté mal escrito, o que se haya pedido demasiadas veces
    // seguidas. Lo demás se calla, por lo dicho arriba.
    if (error && /invalid|rate|seconds|security purposes/i.test(error.message)) {
      setError(
        /rate|seconds|security purposes/i.test(error.message)
          ? "Has pedido varios correos seguidos. Espera un minuto y vuelve a intentarlo."
          : "Ese correo no tiene buena pinta. Revísalo y vuelve a intentarlo.",
      );
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <Logo variant="horizontal" height={24} />
        </div>
        <p className="admin-login-sub">Recuperar el acceso</p>

        {enviado ? (
          <>
            <p className="admin-recuperar-ok">
              Si esa cuenta existe, le acabamos de mandar un enlace. Ábrelo desde este mismo
              teléfono u ordenador y te dejará poner una contraseña nueva.
            </p>
            <p className="admin-recuperar-nota">
              El enlace caduca en una hora. Si no lo ves, mira en «spam».
            </p>
            <Link className="admin-btn-secundario admin-btn-full" href="/admin/login">
              Volver a entrar
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="admin-label" htmlFor="email">
              Tu correo
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
            <button className="admin-btn-primary admin-btn-full" type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Mandarme el enlace"}
            </button>
            {error && <p className="admin-error">{error}</p>}
            <Link className="admin-login-volver" href="/admin/login">
              Volver
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
