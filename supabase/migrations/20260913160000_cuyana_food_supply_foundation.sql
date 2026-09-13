-- CUYANA-FOOD-001: abastecimiento multi-proveedor e historial verificable.
-- Estas tablas son operativas y no tienen lectura pública. El catálogo público
-- se expondrá mediante código servidor cuando una oferta haya sido aprobada.

create table public.market_suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  website_url text not null,
  priority integer not null default 100,
  status text not null default 'watch' check (status in ('active','watch','paused','rejected')),
  direct_to_recipient boolean not null default false,
  via_cuyana_hub boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null check (kind in ('product','bundle')),
  category text not null,
  summary text,
  presentation text,
  composition jsonb,
  substitution_policy text,
  research_status text not null default 'YELLOW' check (research_status in ('GREEN','GREEN_DRAFT','YELLOW','RED')),
  purchasable boolean not null default false,
  image_status text not null default 'needed' check (image_status in ('needed','brief_ready','generated_draft','verified','published')),
  public_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not purchasable or research_status = 'GREEN')
);

create table public.market_bundle_items (
  bundle_id uuid not null references public.market_products(id) on delete cascade,
  product_id uuid not null references public.market_products(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null,
  notes text,
  primary key (bundle_id, product_id),
  check (bundle_id <> product_id)
);

create table public.market_supplier_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.market_products(id) on delete cascade,
  supplier_id uuid not null references public.market_suppliers(id) on delete restrict,
  source_url text not null,
  external_id text,
  source_price numeric(12,2) not null check (source_price >= 0),
  currency text not null default 'USD',
  supplier_shipping numeric(12,2),
  availability text not null default 'unknown' check (availability in ('available','unavailable','unknown')),
  presentation text,
  composition jsonb,
  destination_scope jsonb,
  eta_text text,
  extraction_confidence numeric(5,2) check (extraction_confidence between 0 and 100),
  observed_at timestamptz not null,
  last_checked_at timestamptz,
  valid_until timestamptz,
  status text not null default 'research' check (status in ('research','candidate','approved','blocked','retired')),
  is_primary boolean not null default false,
  snapshot_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, supplier_id, source_url)
);

create unique index market_one_primary_offer_per_product
  on public.market_supplier_offers(product_id) where is_primary and status <> 'retired';

create table public.market_supplier_observations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.market_supplier_offers(id) on delete cascade,
  observed_at timestamptz not null default now(),
  http_status integer,
  resolved_url text,
  source_reachable boolean not null default true,
  price numeric(12,2),
  currency text,
  availability text check (availability in ('available','unavailable','unknown')),
  presentation text,
  composition jsonb,
  supplier_shipping numeric(12,2),
  destination_scope jsonb,
  eta_text text,
  extraction_confidence numeric(5,2) check (extraction_confidence between 0 and 100),
  snapshot jsonb not null default '{}'::jsonb,
  snapshot_hash text
);

create table public.market_supplier_audits (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.market_supplier_offers(id) on delete cascade,
  previous_observation_id uuid references public.market_supplier_observations(id),
  current_observation_id uuid not null references public.market_supplier_observations(id),
  severity text not null check (severity in ('NONE','LOW','HIGH','CRITICAL')),
  diffs jsonb not null default '[]'::jsonb,
  blocks_purchase boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.market_audit_settings (
  id text primary key default 'default' check (id = 'default'),
  high_price_change_pct numeric(5,2) not null default 5,
  critical_price_change_pct numeric(5,2) not null default 15,
  active_offer_max_age_hours integer not null default 24 check (active_offer_max_age_hours > 0),
  updated_at timestamptz not null default now()
);

insert into public.market_audit_settings(id) values ('default') on conflict (id) do nothing;

create table public.market_order_supply_snapshots (
  id uuid primary key default gen_random_uuid(),
  store_order_id uuid not null references public.store_orders(id) on delete restrict,
  supplier_offer_id uuid not null references public.market_supplier_offers(id) on delete restrict,
  source_url text not null,
  fulfillment_mode text not null check (fulfillment_mode in ('direct_to_recipient','via_cuyana_hub')),
  supplier_cost numeric(12,2) not null check (supplier_cost >= 0),
  supplier_shipping numeric(12,2) not null default 0 check (supplier_shipping >= 0),
  payment_fx_fee numeric(12,2) not null default 0 check (payment_fx_fee >= 0),
  unavoidable_logistics numeric(12,2) not null default 0 check (unavoidable_logistics >= 0),
  landed_cost numeric(12,2) not null check (landed_cost >= 0),
  markup_rate numeric(8,6) not null,
  sale_price_usd numeric(12,2) not null,
  commercial_rate_gyd_per_usd numeric(18,8),
  sale_price_gyd numeric(14,2),
  ernesto_share numeric(12,2) not null,
  adonys_share numeric(12,2) not null,
  cuyana_share numeric(12,2) not null,
  other_costs numeric(12,2) not null default 0,
  realized_net_profit numeric(12,2),
  purchased_at timestamptz,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.market_suppliers enable row level security;
alter table public.market_products enable row level security;
alter table public.market_bundle_items enable row level security;
alter table public.market_supplier_offers enable row level security;
alter table public.market_supplier_observations enable row level security;
alter table public.market_supplier_audits enable row level security;
alter table public.market_audit_settings enable row level security;
alter table public.market_order_supply_snapshots enable row level security;

do $policies$
declare table_name text;
begin
  foreach table_name in array array[
    'market_suppliers','market_products','market_bundle_items','market_supplier_offers',
    'market_supplier_observations','market_supplier_audits','market_audit_settings','market_order_supply_snapshots'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((auth.jwt() ->> ''email'') = ''ernest196391@gmail.com'') with check ((auth.jwt() ->> ''email'') = ''ernest196391@gmail.com'')',
      table_name || '_solo_admin', table_name
    );
  end loop;
end
$policies$;

revoke all on public.market_suppliers, public.market_products, public.market_bundle_items,
  public.market_supplier_offers, public.market_supplier_observations, public.market_supplier_audits,
  public.market_audit_settings, public.market_order_supply_snapshots from anon;
grant select, insert, update, delete on public.market_suppliers, public.market_products, public.market_bundle_items,
  public.market_supplier_offers, public.market_supplier_observations, public.market_supplier_audits,
  public.market_audit_settings, public.market_order_supply_snapshots to authenticated;
