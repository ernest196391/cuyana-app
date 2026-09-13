"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * ¿Esta cuenta administra?
 *
 * Se le pregunta a la base (`es_admin()`, que mira la tabla `app_admins`) en
 * vez de comparar un correo escrito aquí: dar de alta a otro administrador
 * tiene que ser una fila, no un despliegue. Fuera del componente para que el
 * efecto no dependa de una función que se recrea en cada render.
 */
export async function esAdministrador() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("es_admin");
  if (error) {
    console.error("No se pudo comprobar si la cuenta es administradora", error);
    return false;
  }
  return data === true;
}

/**
 * La sesión del panel.
 *
 * Tener sesión NO es ser administrador. Desde que existen cuentas de cliente,
 * cualquiera que se registre en la web tiene sesión, y con solo comprobar eso
 * entraría aquí: no vería datos de nadie —las políticas de la base filtran por
 * administrador, no por estar dentro— pero sí un panel vacío y desconcertante
 * con botones que no hacen nada.
 */
export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    // Sin catch, una sesión corrupta o un fallo de red dejaban el panel entero
    // en "Cargando…" para siempre. Si no se puede resolver la sesión, no hay
    // usuario: el layout manda a /admin/login y se vuelve a entrar.
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        const u = data.session?.user ?? null;
        setUser(u && (await esAdministrador()) ? u : null);
      } catch (err) {
        console.error("No se pudo leer la sesión", err);
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const u = session?.user ?? null;
      const admin = u ? await esAdministrador() : false;
      if (!active) return;
      setUser(admin ? u : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
