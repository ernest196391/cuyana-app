-- Read model público sanitizado. Las fuentes, URLs y costos permanecen en las
-- tablas market_* privadas. Esta tabla solo contiene lo que CUYANA muestra.
create table public.market_public_catalog (
  product_id uuid primary key references public.market_products(id) on delete cascade,
  slug text unique not null,
  name text not null,
  kind text not null check (kind in ('product','bundle')),
  category text not null check (category in ('alimentos','hogar')),
  description text not null,
  presentation text,
  composition jsonb,
  substitution_policy text,
  price_usd numeric(12,2) not null check (price_usd >= 0),
  available boolean not null default false,
  eta_text text,
  image_url text,
  source_checked_at timestamptz not null,
  valid_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.market_public_catalog enable row level security;

create policy market_public_catalog_lectura on public.market_public_catalog
  for select to anon, authenticated using (available and (valid_until is null or valid_until > now()));

create policy market_public_catalog_solo_admin on public.market_public_catalog
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ernest196391@gmail.com');

grant select on public.market_public_catalog to anon, authenticated;
grant insert, update, delete on public.market_public_catalog to authenticated;
