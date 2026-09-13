"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCuenta } from "@/lib/cuenta";

/**
 * Entrar o crear una cuenta, en la misma pantalla.
 *
 * Dos botones y no dos páginas: quien llega aquí no sabe si ya tiene cuenta,
 * y mandarlo a buscar el enlace correcto es la forma más fácil de perderlo.
 */
function Entrar() {
  const router = useRouter();
  const params = useSearchParams();
  // A dónde iba antes de que le pidiéramos entrar. Se vuelve allí, no a la
  // portada: si venía a pedir una remesa, tiene que acabar pidiéndola.
  const volverA = params.get("volver") || "/cuenta";
  const { user, cargando } = useCuenta();

  const [modo, setModo] = useState<"entrar" | "crear">(params.get("crear") ? "crear" : "entrar");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && user) router.replace(volverA);
  }, [cargando, user, router, volverA]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setEnviando(true);
    setError(null);
    setAviso(null);

    if (modo === "entrar") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password: clave });
      setEnviando(false);
      if (err) {
        setError("Ese correo o esa contraseña no coinciden.");
        return;
      }
      router.replace(volverA);
      return;
    }

    if (clave.length < 8) {
      setEnviando(false);
      setError("La contraseña necesita ocho caracteres o más.");
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password: clave,
      // El nombre y el teléfono viajan con el alta: un trigger de la base crea
      // el perfil con ellos, así que no hay un segundo paso que pueda fallar.
      options: { data: { full_name: nombre.trim(), phone: telefono.trim() } },
    });
    setEnviando(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("already")
          ? "Ya hay una cuenta con ese correo. Entra con tu contraseña."
          : "No se pudo crear la cuenta. Inténtalo otra vez."
      );
      return;
    }
    // Según cómo esté configurado el correo, el alta puede dejar la sesión
    // abierta o pedir que confirmen primero. Se contemplan las dos: dar por
    // hecha una sola dejaría a la mitad de la gente mirando una pantalla que
    // no avanza.
    if (data.session) {
      router.replace(volverA);
      return;
    }
    setAviso("Te mandamos un correo para confirmar tu cuenta. Ábrelo y vuelve aquí.");
  }

  if (cargando || user) {
    return (
      <div className="wrap page-section">
        <p className="page-lead">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="wrap page-section cuenta-entrar">
      <h1 className="page-title">{modo === "entrar" ? "Entra en tu cuenta" : "Crea tu cuenta"}</h1>
      <p className="page-lead">
        Con tu cuenta ves tus envíos, por dónde va cada uno y cuánto has enviado. Pedir por WhatsApp
        sigue funcionando igual.
      </p>

      {/* Botones normales con `aria-pressed`, y no un tablist: un tablist de
          verdad necesita paneles y navegación con las flechas, y anunciarse
          como algo que no se es deja a quien usa lector de pantalla peor que
          con dos botones corrientes. */}
      <div className="cuenta-tabs">
        <button
          type="button"
          aria-pressed={modo === "entrar"}
          className={modo === "entrar" ? "cuenta-tab cuenta-tab-activa" : "cuenta-tab"}
          onClick={() => { setModo("entrar"); setError(null); setAviso(null); }}
        >
          Ya tengo cuenta
        </button>
        <button
          type="button"
          aria-pressed={modo === "crear"}
          className={modo === "crear" ? "cuenta-tab cuenta-tab-activa" : "cuenta-tab"}
          onClick={() => { setModo("crear"); setError(null); setAviso(null); }}
        >
          Crear una
        </button>
      </div>

      <form className="cuenta-form" onSubmit={enviar}>
        {modo === "crear" && (
          <>
            <label className="field" htmlFor="nombre">
              <span>Tu nombre y apellidos</span>
              <input
                id="nombre"
                className="campo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="field" htmlFor="telefono">
              <span>Tu WhatsApp</span>
              <input
                id="telefono"
                className="campo"
                type="tel"
                inputMode="tel"
                placeholder="+592 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                autoComplete="tel"
                required
              />
            </label>
          </>
        )}

        <label className="field" htmlFor="email">
          <span>Correo</span>
          <input
            id="email"
            className="campo"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete={modo === "crear" ? "email" : "username"}
            required
          />
        </label>

        <label className="field" htmlFor="clave">
          <span>Contraseña</span>
          <input
            id="clave"
            className="campo"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete={modo === "crear" ? "new-password" : "current-password"}
            required
          />
          {modo === "crear" && <small className="cuenta-ayuda">Ocho caracteres o más.</small>}
        </label>

        <button className="cta" type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear mi cuenta"}
        </button>

        {error && <p className="cuenta-error" role="alert">{error}</p>}
        {aviso && <p className="cuenta-aviso" role="status">{aviso}</p>}
      </form>

      <p className="cuenta-pie">
        ¿Prefieres no registrarte? <Link href="/enviar-dinero">Pide por WhatsApp</Link>.
      </p>
    </div>
  );
}

export default function EntrarPage() {
  // useSearchParams obliga a un límite de Suspense para que la página pueda
  // seguir siendo estática.
  return (
    <Suspense fallback={<div className="wrap page-section"><p className="page-lead">Cargando…</p></div>}>
      <Entrar />
    </Suspense>
  );
}
