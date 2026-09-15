"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const MINIMO = 10;

/**
 * Cambiar mi propia contraseña, ya dentro del panel.
 *
 * Hasta hoy el panel no tenía esto. La única forma de cambiar una contraseña
 * era abrir la base de datos y escribir el cifrado a mano — que es como se
 * resolvió el 15 de septiembre, y no es forma de trabajar: obliga a que
 * alguien con acceso total a la base esté disponible cada vez que a una
 * persona se le olvida su clave.
 *
 * No se pide la contraseña vieja. Supabase no la comprueba en este paso y
 * fingir que lo hace sería teatro: quien tiene la sesión abierta ya está
 * dentro. Lo que protege de verdad es que la sesión caduque y que solo entren
 * cuentas de `app_admins`.
 */
export default function MiClavePage() {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setListo(false);

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
    setGuardando(false);

    if (fallo) {
      setError(
        /weak|short|password/i.test(fallo.message)
          ? "Esa contraseña es muy fácil. Prueba con uno o dos datos más."
          : "No se pudo guardar. Vuelve a intentarlo.",
      );
      return;
    }

    setClave("");
    setRepetida("");
    setListo(true);
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Tu cuenta</p>
          <h1>Cambiar contraseña</h1>
        </div>
      </header>

      <form className="admin-clave-form" onSubmit={handleSubmit}>
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
          {guardando ? "Guardando…" : "Guardar"}
        </button>

        {error && <p className="admin-error" role="alert">{error}</p>}
        {listo && (
          <p className="supply-success" role="status">
            Contraseña cambiada. La próxima vez entra con la nueva.
          </p>
        )}
        <p className="admin-recuperar-nota">Al menos {MINIMO} caracteres.</p>
      </form>
    </div>
  );
}
