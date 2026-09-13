import { createClient } from "@supabase/supabase-js";

// El catálogo público y su tasa comercial pertenecen al proyecto canónico
// de CUYANA Market. Se usa un cliente de solo lectura separado para evitar
// que una variable heredada de otro entorno de la app desvíe FOOD a un
// catálogo antiguo. La publishable key es pública; la protección vive en RLS.
export const marketSupabase = createClient(
  "https://dkiiknsfbefpkrnmbzid.supabase.co",
  "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN",
  {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
