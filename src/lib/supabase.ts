import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// La URL del proyecto y la "publishable key" (anon) de Supabase están
// pensadas para vivir en el navegador — la protección real es RLS, no
// mantenerlas en secreto. Se pueden sobreescribir con variables de entorno
// (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) si se prefiere
// configurarlas en Vercel, pero no es obligatorio: sin ellas, la app usa
// estos valores por defecto y funciona igual.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkiiknsfbefpkrnmbzid.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_yMOSejoGKPJSCLrYDDShtw_G8ig56lN";

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
