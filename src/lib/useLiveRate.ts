import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type RateStatus = "loading" | "ready" | "error";

export interface LiveRate {
  rate: number | null;
  updatedAt: string | null;
  status: RateStatus;
}

/** Lee en vivo la tasa GYD -> CUP y su updated_at desde rate_config (fila única, id = 1). */
export function useLiveRate(): LiveRate {
  const [state, setState] = useState<LiveRate>({ rate: null, updatedAt: null, status: "loading" });

  useEffect(() => {
    if (!supabase) {
      setState({ rate: null, updatedAt: null, status: "error" });
      return;
    }
    let active = true;

    (async () => {
      try {
        const queryPromise = Promise.resolve(
          supabase.from("rate_config").select("rate_gyd_to_cup, updated_at").eq("id", 1).single()
        );
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Tiempo de espera agotado")), 8000);
        });
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (!active) return;
        if (error || !data) {
          console.error("No se pudo leer rate_config desde Supabase", error);
          setState({ rate: null, updatedAt: null, status: "error" });
          return;
        }
        setState({
          rate: Number(data.rate_gyd_to_cup),
          updatedAt: data.updated_at as string,
          status: "ready",
        });
      } catch (err) {
        if (!active) return;
        console.error("No se pudo conectar con Supabase", err);
        setState({ rate: null, updatedAt: null, status: "error" });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
