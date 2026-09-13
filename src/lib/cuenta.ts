"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * La cuenta del cliente.
 *
 * Es la MISMA autenticación que usa /admin —un solo Supabase, un solo login—
 * pero no la misma puerta: quien entra aquí es un cliente, y ser administrador
 * es otra cosa que se comprueba aparte (`app_admins` en la base). Un cliente
 * con sesión no es un administrador por tener sesión.
 */

export type Nivel = "sin_verificar" | "en_revision" | "verificado" | "confianza" | "rechazado";

export interface PerfilCliente {
  id: string;
  full_name: string | null;
  phone: string | null;
  nivel: Nivel;
  motivo_rechazo: string | null;
  /** Cuánto se le puede adelantar. Lo decide una persona, nunca la app. */
  credito_usd: number;
}

/** Lo que se le enseña. En la base van las claves de arriba. */
export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  sin_verificar: "Sin verificar",
  en_revision: "En revisión",
  verificado: "Cuenta verificada",
  confianza: "Cliente de confianza",
  rechazado: "No se pudo verificar",
};

/** Qué significa para el cliente, en una línea y sin jerga. */
export const EXPLICACION_NIVEL: Record<Nivel, string> = {
  sin_verificar: "Verifica tu cuenta para desbloquear ventajas.",
  en_revision: "Estamos revisando tus datos. Te avisamos en cuanto esté.",
  verificado: "Tus datos están confirmados.",
  confianza: "Puedes pedir que entreguemos en Cuba antes de pagar.",
  rechazado: "Vuelve a enviar tus documentos o escríbenos.",
};

/** Solo quien está verificado lleva palomita. «En revisión» todavía no es sí. */
export function tienePalomita(nivel: Nivel | undefined) {
  return nivel === "verificado" || nivel === "confianza";
}

export function useCuenta() {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const [cargando, setCargando] = useState(true);

  const leerPerfil = useCallback(async (id: string) => {
    if (!supabase) return null;
    const { data } = await supabase
      .from("customer_profiles")
      .select("id, full_name, phone, nivel, motivo_rechazo, credito_usd")
      .eq("id", id)
      .maybeSingle();
    return (data as PerfilCliente | null) ?? null;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setCargando(false);
      return;
    }
    let vivo = true;

    // Sin catch, una sesión rota dejaba la pantalla en «Cargando…» para
    // siempre. Si no se puede resolver, no hay sesión: se manda a entrar.
    (async () => {
      try {
        const { data } = await supabase!.auth.getSession();
        if (!vivo) return;
        const u = data.session?.user ?? null;
        setUser(u);
        setPerfil(u ? await leerPerfil(u.id) : null);
      } catch (err) {
        console.error("No se pudo leer la sesión", err);
        if (vivo) { setUser(null); setPerfil(null); }
      } finally {
        if (vivo) setCargando(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!vivo) return;
      const u = session?.user ?? null;
      setUser(u);
      setPerfil(u ? await leerPerfil(u.id) : null);
    });

    return () => { vivo = false; sub.subscription.unsubscribe(); };
  }, [leerPerfil]);

  const refrescar = useCallback(async () => {
    if (user) setPerfil(await leerPerfil(user.id));
  }, [user, leerPerfil]);

  return { user, perfil, cargando, refrescar };
}
