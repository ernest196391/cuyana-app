"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

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
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("No se pudo leer la sesión", err);
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
