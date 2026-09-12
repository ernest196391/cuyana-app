-- CUYANA-WEB-002: tasa comercial GYD/USD de la tienda (independiente de la
-- tasa de remesas en rate_config/delivery_methods) y pedidos de tienda
-- (alimentos/energía) persistidos ANTES de abrir WhatsApp. No se inserta
-- ninguna tasa inicial: mientras no exista fila en commercial_rates, el
-- precio se muestra solo en USD (ver src/lib/catalog/commercialRate.ts).
--
-- Aplicada directamente al proyecto Supabase real (dkiiknsfbefpkrnmbzid)
-- vía MCP. Este archivo es el registro versionado en el repositorio.

create table if not exists public.commercial_rates (
  id text primary key,
  gyd_per_usd numeric(18,8) not null check (gyd_per_usd > 0),
  source text not null,
  as_of timestamptz not null,
  expires_at timestamptz,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.commercial_rates enable row level security;

create policy commercial_rates_public_read on public.commercial_rates
  for select to public
  using (true);

create policy commercial_rates_solo_admin_insert on public.commercial_rates
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

create policy commercial_rates_solo_admin_update on public.commercial_rates
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

-- Pedidos de tienda consumidos del catálogo canónico (Product Studio One /
-- NEXO), separados de `orders` (remesas). El cliente los crea desde el
-- carrito sin sesión (mismo patrón que allow_public_insert_orders para
-- remesas); solo el admin puede leerlos o cambiarles el estado.
create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  category text not null check (category in ('alimentos','energia')),
  items jsonb not null,
  total_usd numeric(12,2) not null check (total_usd >= 0),
  gyd_per_usd numeric(18,8),
  total_gyd numeric(14,2),
  customer_name text not null,
  customer_whatsapp text not null,
  status text not null default 'pendiente_confirmacion'
    check (status in ('pendiente_confirmacion','confirmado','entregado','cancelado')),
  whatsapp_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.store_orders enable row level security;

create policy store_orders_public_insert on public.store_orders
  for insert to public
  with check (true);

create policy store_orders_admin_select on public.store_orders
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

create policy store_orders_admin_update on public.store_orders
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');
