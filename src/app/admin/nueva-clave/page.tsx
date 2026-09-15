"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { esAdministrador } from "@/lib/useAdminAuth";
import Logo from "@/components/Logo";

/** Corta y clara. Diez es lo que pide Supabase por defecto para el panel. */
const MINIMO = 10;

/**
 * Poner una contraseña nueva, al llegar desde el correo de recuperación.
 *
 * Cómo funciona por dentro: el enlace del correo trae un testigo en la
 * dirección, y el cliente de Supabase lo canjea solo por una sesión de
 * recuperación en cuanto carga la página. Por eso aquí no se pide la
 * contraseña vieja: quien abrió ese correo ya demostró quién es.
 *
 * Esa sesión NO aparece de inmediato —el canje tarda un instante—, así que se
 * espera al aviso de Supabase en vez de mirar una sola vez y decidir que el
 * enlace no sirve. Mirar una vez era el error fácil aquí: la pantalla habría
 * dicho «enlace caducado» a alguien que acababa de abrirlo.
 */
export default function AdminNuevaClavePage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"esperando" | "listo" | "sin-enlace">("esperando");
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let vivo = true;

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (!vivo) return;
      if (evento === "PASSWORD_RECOVERY" || sesion) setEstado("listo");
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!vivo) return;
      if (data.session) {
        setEstado("listo");
        return;
      }
      // Margen para que termine el canje del testigo antes de rendirse.
      window.setTimeout(async () => {
        if (!vivo) return;
        const { data: otra } = await supabase!.auth.getSession();
        if (!vivo) return;
        setEstado(otra.session ? "listo" : "sin-enlace");
      }, 2500);
    })();

    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);

    if (clave.length < MINIMO) {
      setError(`La contraseña tiene que tener al menos ${MINIMO} caracteres.`);
      return;
    }
    if (clave !== repetida) {
      setError("Las dos contraseñas no son iguales.");
      return;
    }

    setGuardando(true);
    const { error: fallo } = await supabase.auth.updateUser({ password: clave });
    if (fallo) {
      setGuardando(false);
      setError(
        /weak|short|password/i.test(fallo.message)
          ? "Esa contraseña es muy fácil. Prueba con uno o dos datos más."
          : "No se pudo guardar. Pide otro enlace y vuelve a intentarlo.",
      );
      return;
    }

    // La contraseña ya está cambiada, pero esta puerta no es de cualquiera:
    // un cliente de la tienda también puede recuperar la suya desde aquí si
    // da con la dirección. Se le cierra la sesión y se le dice adónde ir, en
    // vez de dejarlo dentro de un panel que no es suyo.
    if (!(await esAdministrador())) {
      await supabase.auth.signOut();
      setGuardando(false);
      setError(
        "Contraseña cambiada. Pero esa cuenta no administra el sitio: entra en /cuenta con la nueva.",
      );
      return;
    }

    setGuardando(false);
    router.replace("/admin");
  }

  if (estado === "esperando") {
    return <div className="admin-loading">Comprobando el enlace…</div>;
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <Logo variant="horizontal" height={24} />
        </div>
        <p className="admin-login-sub">Contraseña nueva</p>

        {estado === "sin-enlace" ? (
          <>
            <p className="admin-error">
              Este enlace ya no vale. Caducan a la hora, y solo se puede usar una vez.
            </p>
            <Link className="admin-btn-primary admin-btn-full" href="/admin/recuperar">
              Pedir otro enlace
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="admin-label" htmlFor="clave">
              Contraseña nueva
            </label>
            <input
              id="clave"
              className="admin-input"
              type="password"
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />

            <label className="admin-label" htmlFor="repetida">
              Repítela
            </label>
            <input
              id="repetida"
              className="admin-input"
              type="password"
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              required
            />

            <button className="admin-btn-primary admin-btn-full" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar y entrar"}
            </button>
            {error && <p className="admin-error">{error}</p>}
            <p className="admin-recuperar-nota">Al menos {MINIMO} caracteres.</p>
          </form>
        )}
      </div>
    </div>
  );
}
