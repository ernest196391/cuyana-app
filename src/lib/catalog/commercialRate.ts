import { supabase } from "@/lib/supabase";
import type { CommercialRate } from "./types";

/**
 * Tasa comercial GYD/USD de la tienda: vive en `public.commercial_rates`
 * (fila `gyd_usd`), configurada manualmente por el admin desde Supabase.
 * Nunca se reutiliza `rate_config`/`delivery_methods` (esas son la tasa de
 * remesas). Si no hay fila, o si `expires_at` ya pasó, se trata como "no
 * hay tasa": la tienda muestra el precio solo en USD en vez de inventar un
 * valor o mostrar uno vencido como si fuera vigente.
 */
export async function getStoreCommercialRate(): Promise<CommercialRate | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("commercial_rates")
    .select("gyd_per_usd, source, as_of, expires_at")
    .eq("id", "gyd_usd")
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;

  const gydPerUsd = Number(data.gyd_per_usd);
  if (!Number.isFinite(gydPerUsd) || gydPerUsd <= 0) return null;

  return {
    gydPerUsd,
    source: data.source,
    asOf: data.as_of,
    expiresAt: data.expires_at,
  };
}
