-- Optimiza RLS e índices de relaciones del bloque FOOD.
do $policies$
declare table_name text;
begin
  foreach table_name in array array[
    'market_suppliers','market_products','market_bundle_items','market_supplier_offers',
    'market_supplier_observations','market_supplier_audits','market_audit_settings','market_order_supply_snapshots'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_solo_admin', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (((select auth.jwt()) ->> ''email'') = ''ernest196391@gmail.com'') with check (((select auth.jwt()) ->> ''email'') = ''ernest196391@gmail.com'')',
      table_name || '_solo_admin', table_name
    );
  end loop;
end
$policies$;

drop policy if exists market_public_catalog_solo_admin on public.market_public_catalog;
create policy market_public_catalog_admin_insert on public.market_public_catalog for insert to authenticated with check (((select auth.jwt()) ->> 'email') = 'ernest196391@gmail.com');
create policy market_public_catalog_admin_update on public.market_public_catalog for update to authenticated using (((select auth.jwt()) ->> 'email') = 'ernest196391@gmail.com') with check (((select auth.jwt()) ->> 'email') = 'ernest196391@gmail.com');
create policy market_public_catalog_admin_delete on public.market_public_catalog for delete to authenticated using (((select auth.jwt()) ->> 'email') = 'ernest196391@gmail.com');

create index if not exists market_bundle_items_product_idx on public.market_bundle_items(product_id);
create index if not exists market_supplier_offers_supplier_idx on public.market_supplier_offers(supplier_id);
create index if not exists market_supplier_observations_offer_idx on public.market_supplier_observations(offer_id, observed_at desc);
create index if not exists market_supplier_audits_offer_idx on public.market_supplier_audits(offer_id, created_at desc);
create index if not exists market_supplier_audits_previous_idx on public.market_supplier_audits(previous_observation_id);
create index if not exists market_supplier_audits_current_idx on public.market_supplier_audits(current_observation_id);
create index if not exists market_order_supply_order_idx on public.market_order_supply_snapshots(store_order_id);
create index if not exists market_order_supply_offer_idx on public.market_order_supply_snapshots(supplier_offer_id);
