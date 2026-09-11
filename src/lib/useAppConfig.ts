"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type AppConfigStatus = "loading" | "ready" | "error";

/**
 * Lee toda la tabla app_config (clave -> valor) y expone helpers con
 * fallback explícito. Nunca hardcodear estos textos en componentes: si
 * Supabase no responde, se usa el fallback documentado, no un valor nuevo
 * inventado en el momento.
 */
export function useAppConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<AppConfigStatus>("loading");

  useEffect(() => {
    if (!supabase) {
      setStatus("error");
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.from("app_config").select("key, value");
        if (!active) return;
        if (error || !data) {
          setStatus("error");
          return;
        }
        const map: Record<string, string> = {};
        for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
        setConfig(map);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function get(key: string, fallback: string): string {
    return config[key] ?? fallback;
  }

  return { config, status, get };
}
