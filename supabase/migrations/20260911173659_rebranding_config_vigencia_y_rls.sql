-- CUYANA-WEB-001: corrige políticas RLS permisivas duplicadas, agrega
-- vigencia de tasas y una tabla de configuración pública mínima
-- (saludo de WhatsApp) para dejar de hardcodear "Adonys" en el código.
--
-- Aplicada directamente al proyecto Supabase real (dkiiknsfbefpkrnmbzid)
-- el 2026-09-11 vía MCP. Este archivo es el registro versionado en el
-- repositorio; reversión: eliminar app_config, columna rate_source y
-- restaurar las políticas *_admin_* previas si hiciera falta.

-- 1) Seguridad: varias tablas tenían una política amplia (with_check/qual
--    = true para cualquier "authenticated") conviviendo con una política
--    restringida al admin. Como las políticas permisivas se combinan con
--    OR, la amplia anulaba la restricción: cualquier usuario autenticado
--    podía escribir tasas. Se eliminan las políticas amplias, dejando solo
--    las restringidas al admin.
drop policy if exists delivery_methods_admin_insert on public.delivery_methods;
drop policy if exists delivery_methods_admin_update on public.delivery_methods;
drop policy if exists rate_method_history_admin_insert on public.rate_method_history;
drop policy if exists rate_method_history_admin_select on public.rate_method_history;

-- offers no tenía ninguna política restringida al admin (solo la amplia):
-- se reemplaza por el mismo patrón usado en el resto del esquema.
drop policy if exists offers_admin_insert on public.offers;
drop policy if exists offers_admin_update on public.offers;
create policy offers_solo_admin_insert on public.offers
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');
create policy offers_solo_admin_update on public.offers
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

-- 2) Vigencia de tasas: en vez de "tasa de hoy" fija, se deriva del
-- updated_at existente más una ventana de frescura configurable.
alter table public.delivery_methods
  add column if not exists rate_source text;

-- 3) Configuración pública mínima, editable solo por el admin, legible por
-- cualquiera (son textos de interfaz, no secretos). Sustituye valores que
-- antes vivían hardcodeados en el código (saludo de WhatsApp, ventanas de
-- vigencia de tasa).
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy app_config_public_read on public.app_config
  for select to public
  using (true);

create policy app_config_solo_admin_write on public.app_config
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

create policy app_config_solo_admin_update on public.app_config
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

-- Valor observado en auditoría (2026-09-11), migrado tal cual a
-- configuración: no se altera el saludo real usado en producción, solo se
-- deja de hardcodear en el código fuente.
insert into public.app_config (key, value, updated_by)
values
  ('whatsapp_greeting_name', 'Adonys', 'migration:CUYANA-WEB-001'),
  ('rate_fresh_hours', '12', 'migration:CUYANA-WEB-001'),
  ('rate_stale_hours', '24', 'migration:CUYANA-WEB-001')
on conflict (key) do nothing;
