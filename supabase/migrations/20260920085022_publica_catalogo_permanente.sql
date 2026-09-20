-- El administrador controla la publicación. La vigencia de una comprobación
-- queda como dato de auditoría y ya no elimina productos del escaparate.
drop policy if exists market_public_catalog_lectura on public.market_public_catalog;
create policy market_public_catalog_lectura
  on public.market_public_catalog
  for select to anon, authenticated
  using (available);

-- Publicar todas las fichas que ya tienen precio. Alimentos se entrega en toda
-- Cuba según la cobertura concreta del proveedor/destino.
update public.market_public_catalog
set available = true,
    valid_until = null,
    delivery_location = case
      when category = 'alimentos' then 'Toda Cuba, según cobertura'
      else coalesce(delivery_location, 'Toda Cuba, según cobertura')
    end,
    updated_at = now()
where category in ('alimentos', 'electrodomesticos')
  and price_usd > 0;

update public.market_products p
set purchasable = true,
    updated_at = now()
where exists (
  select 1
  from public.market_public_catalog c
  where c.product_id = p.id
    and c.available = true
    and c.price_usd > 0
);

-- Completar la única ficha combinada que todavía carecía de los datos que la
-- interfaz exige para permitir la compra.
update public.market_public_catalog
set description = 'Pollo, cerdo y aceite para resolver varias comidas familiares.',
    composition = '["3 lb de pollo", "2 lb de cerdo", "900 ml–1 L de aceite"]'::jsonb,
    substitution_policy = 'Si cambia la marca, el corte o la presentación, CUYANA confirma contigo antes de sustituir.',
    updated_at = now()
where slug = 'combo-carnes-aceite';
