-- CUYANA-FOOD-002: tasa comercial del lanzamiento y publicación de activos
-- aprobados. No mezcla esta tasa con las tasas de remesas.
insert into public.commercial_rates (id,gyd_per_usd,source,as_of,expires_at,updated_by,updated_at)
values ('gyd_usd',245,'Referencia comercial operativa CUYANA',now(),now()+interval '7 days','CUYANA-FOOD-002',now())
on conflict (id) do update set gyd_per_usd=excluded.gyd_per_usd,source=excluded.source,as_of=excluded.as_of,expires_at=excluded.expires_at,updated_by=excluded.updated_by,updated_at=now();

with assets(slug,image_url) as (values
 ('combo-proteina-mixta','/catalog/alimentos/combo-proteina-mixta/hero.webp'),
 ('combo-basicos-de-casa','/catalog/alimentos/combo-basicos-de-casa/hero.webp'),
 ('combo-carnes-aceite','/catalog/alimentos/combo-carnes-aceite/hero.webp'),
 ('combo-proteina-familiar','/catalog/alimentos/combo-proteina-familiar/hero.webp'),
 ('combo-aseo-personal','/catalog/alimentos/combo-aseo-personal/hero.webp'),
 ('huevos-30-unidades','/catalog/alimentos/huevos-30-unidades/hero.webp'),
 ('muslos-pollo-10-lb','/catalog/alimentos/muslos-pollo-10-lb/hero.webp'),
 ('solomillo-cerdo','/catalog/alimentos/solomillo-cerdo/hero.webp'),
 ('arroz-blanco-dona-kuca-1kg','/catalog/alimentos/arroz-blanco-dona-kuca-1kg/hero.webp'),
 ('frijol-negro-1kg','/catalog/alimentos/frijol-negro-1kg/hero.webp'),
 ('aceite-vegetal-1l','/catalog/alimentos/aceite-vegetal-1l/hero.webp'),
 ('azucar-blanca-1kg','/catalog/alimentos/azucar-blanca-1kg/hero.webp'),
 ('penne-rigate-500g','/catalog/alimentos/penne-rigate-500g/hero.webp'),
 ('pasta-tomate-400g','/catalog/alimentos/pasta-tomate-400g/hero.webp'),
 ('atun-170g','/catalog/alimentos/atun-170g/hero.webp'),
 ('jamonilla-cerdo-320g','/catalog/alimentos/jamonilla-cerdo-320g/hero.webp'),
 ('mantequilla-200g','/catalog/alimentos/mantequilla-200g/hero.webp')
)
update public.market_products p set public_image_url=a.image_url,image_status='published',updated_at=now()
from assets a where p.slug=a.slug;

update public.market_public_catalog c set image_url=p.public_image_url,updated_at=now()
from public.market_products p where c.product_id=p.id and p.image_status='published';

-- La ficha exacta histórica devuelve 404, pero el listado vivo de Alawao
-- volvió a certificar hoy el mismo combo, composición, precio y stock.
with target as (select id from public.market_products where slug='combo-carnes-aceite')
update public.market_supplier_offers o set availability='available',status='approved',last_checked_at=now(),valid_until=now()+interval '24 hours',updated_at=now()
from target where o.product_id=target.id and o.is_primary;

insert into public.market_supplier_observations (offer_id,http_status,resolved_url,source_reachable,price,currency,availability,presentation,composition,supplier_shipping,destination_scope,eta_text,extraction_confidence,snapshot)
select o.id,200,'https://alawao.com/pasillo/servicio-mercado/combos-mercado/',true,35.95,'USD','available',o.presentation,o.composition,o.supplier_shipping,o.destination_scope,'Entrega express 24 h',90,'{"method":"manual_category_revalidation","date":"2026-09-13","note":"La categoría viva muestra Cerdo + Pollo + Aceite en stock a USD 35.95"}'::jsonb
from public.market_supplier_offers o join public.market_products p on p.id=o.product_id
where p.slug='combo-carnes-aceite' and o.is_primary;

update public.market_products set purchasable=true where slug='combo-carnes-aceite' and research_status='GREEN';
insert into public.market_public_catalog (product_id,slug,name,kind,category,description,presentation,composition,substitution_policy,price_usd,available,eta_text,image_url,source_checked_at,valid_until)
select id,slug,name,kind,'alimentos',coalesce(summary,''),presentation,composition,substitution_policy,41.34,true,'Entrega express 24 h','/catalog/alimentos/combo-carnes-aceite/hero.webp',now(),now()+interval '24 hours'
from public.market_products where slug='combo-carnes-aceite'
on conflict (product_id) do update set available=true,price_usd=excluded.price_usd,eta_text=excluded.eta_text,source_checked_at=excluded.source_checked_at,valid_until=excluded.valid_until,image_url=excluded.image_url,updated_at=now();
