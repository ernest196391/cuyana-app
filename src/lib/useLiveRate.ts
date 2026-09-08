import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/** Lee en vivo la tasa GYD -> CUP desde la tabla rate_config (fila única, id = 1). */
export function useLiveRate() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("rate_config")
      .select("rate_gyd_to_cup")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("No se pudo leer rate_config desde Supabase", error);
          return;
        }
        if (data) setRate(Number(data.rate_gyd_to_cup));
      });

    return () => {
      active = false;
    };
  }, []);

  return rate;
}
