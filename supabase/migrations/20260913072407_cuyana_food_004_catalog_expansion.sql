-- CUYANA-FOOD-004: expansión conservadora del catálogo existente.
-- Revalidación manual contra las fichas vigentes del proveedor el 2026-09-13.
-- No modifica el 15 % ni la tasa comercial de 245 GYD/USD.

begin;

with verified(slug, source_url, cost_usd, presentation, eta_text, description) as (values
  ('muslos-pollo-10-lb', 'https://alawao.com/pasillo/recomendados/', 16.95::numeric, '10 lb', 'Entrega express 24 h', 'Paquete familiar de pollo de 10 lb.'),
  ('frijol-negro-1kg', 'https://combitos.com/producto/frijol-negro-meu-biju-1kg/', 1.67::numeric, '1 kg', 'Mismo día antes de las 12:00; después, próximo día', 'Frijol negro Meu Biju en bolsa de 1 kg.'),
  ('azucar-blanca-1kg', 'https://combitos.com/producto/azucar-blanca-cristalina-energy-1kg/', 1.80::numeric, '1 kg', 'Mismo día antes de las 12:00; después, próximo día', 'Azúcar blanca cristalina Energy en bolsa de 1 kg.'),
  ('atun-170g', 'https://combitos.com/producto/atun-mar-del-pacifico-filete-en-aceite-vegetal-170g/', 1.32::numeric, '170 g', 'Mismo día antes de las 12:00; después, próximo día', 'Filete de atún Mar del Pacífico en aceite vegetal, lata de 170 g.'),
  ('jamonilla-cerdo-320g', 'https://combitos.com/producto/jamonilla-de-cerdo-oderich-320g/', 2.27::numeric, '320 g', 'Mismo día antes de las 12:00; después, próximo día', 'Jamonilla de cerdo Oderich en lata de 320 g.'),
  ('mantequilla-200g', 'https://combitos.com/producto/mantequilla-comby-200g/', 1.40::numeric, '200 g', 'Mismo día antes de las 12:00; después, próximo día', 'Mantequilla Combi en envase de 200 g.'),
  ('pasta-tomate-400g', 'https://combitos.com/producto/pasta-de-tomate-vima-28-30-14-oz-400g/', 1.33::numeric, '400 g', 'Mismo día antes de las 12:00; después, próximo día', 'Pasta de tomate Vima 28/30 en envase de 400 g.'),
  ('penne-rigate-500g', 'https://combitos.com/producto/penne-rigate-ria-via-500g/', 0.93::numeric, '500 g', 'Mismo día antes de las 12:00; después, próximo día', 'Penne Rigate Ria Via en paquete de 500 g.')
), target_offers as (
  select o.id, o.product_id, v.*
  from verified v
  join public.market_products p on p.slug = v.slug
  join public.market_supplier_offers o on o.product_id = p.id
)
update public.market_supplier_offers o
set source_url = t.source_url,
    source_price = t.cost_usd,
    currency = 'USD',
    availability = 'available',
    presentation = t.presentation,
    eta_text = t.eta_text,
    extraction_confidence = 100,
    last_checked_at = now(),
    valid_until = now() + interval '24 hours',
    status = 'approved',
    is_primary = true,
    snapshot_hash = md5(t.slug || ':' || t.cost_usd::text || ':available:' || t.presentation),
    updated_at = now()
from target_offers t
where o.id = t.id;

with verified(slug, source_url, cost_usd, presentation, eta_text) as (values
  ('muslos-pollo-10-lb', 'https://alawao.com/pasillo/recomendados/', 16.95::numeric, '10 lb', 'Entrega express 24 h'),
  ('frijol-negro-1kg', 'https://combitos.com/producto/frijol-negro-meu-biju-1kg/', 1.67::numeric, '1 kg', 'Mismo día antes de las 12:00; después, próximo día'),
  ('azucar-blanca-1kg', 'https://combitos.com/producto/azucar-blanca-cristalina-energy-1kg/', 1.80::numeric, '1 kg', 'Mismo día antes de las 12:00; después, próximo día'),
  ('atun-170g', 'https://combitos.com/producto/atun-mar-del-pacifico-filete-en-aceite-vegetal-170g/', 1.32::numeric, '170 g', 'Mismo día antes de las 12:00; después, próximo día'),
  ('jamonilla-cerdo-320g', 'https://combitos.com/producto/jamonilla-de-cerdo-oderich-320g/', 2.27::numeric, '320 g', 'Mismo día antes de las 12:00; después, próximo día'),
  ('mantequilla-200g', 'https://combitos.com/producto/mantequilla-comby-200g/', 1.40::numeric, '200 g', 'Mismo día antes de las 12:00; después, próximo día'),
  ('pasta-tomate-400g', 'https://combitos.com/producto/pasta-de-tomate-vima-28-30-14-oz-400g/', 1.33::numeric, '400 g', 'Mismo día antes de las 12:00; después, próximo día'),
  ('penne-rigate-500g', 'https://combitos.com/producto/penne-rigate-ria-via-500g/', 0.93::numeric, '500 g', 'Mismo día antes de las 12:00; después, próximo día')
)
insert into public.market_supplier_observations
  (offer_id, observed_at, http_status, resolved_url, source_reachable, price, currency, availability, presentation, eta_text, extraction_confidence, snapshot, snapshot_hash)
select o.id, now(), 200, v.source_url, true, v.cost_usd, 'USD', 'available', v.presentation, v.eta_text, 100,
       jsonb_build_object('batch','CUYANA-FOOD-004','checked_at',now(),'method','manual_official_product_page'),
       md5(v.slug || ':' || v.cost_usd::text || ':available:' || v.presentation)
from verified v
join public.market_products p on p.slug = v.slug
join public.market_supplier_offers o on o.product_id = p.id;

with verified(slug, price_usd, description, eta_text) as (values
  ('muslos-pollo-10-lb', 19.49::numeric, 'Paquete familiar de pollo de 10 lb.', 'Entrega express 24 h'),
  ('frijol-negro-1kg', 1.92::numeric, 'Frijol negro Meu Biju en bolsa de 1 kg.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('azucar-blanca-1kg', 2.07::numeric, 'Azúcar blanca cristalina Energy en bolsa de 1 kg.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('atun-170g', 1.52::numeric, 'Filete de atún Mar del Pacífico en aceite vegetal, lata de 170 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('jamonilla-cerdo-320g', 2.61::numeric, 'Jamonilla de cerdo Oderich en lata de 320 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('mantequilla-200g', 1.61::numeric, 'Mantequilla Combi en envase de 200 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('pasta-tomate-400g', 1.53::numeric, 'Pasta de tomate Vima 28/30 en envase de 400 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('penne-rigate-500g', 1.07::numeric, 'Penne Rigate Ria Via en paquete de 500 g.', 'Mismo día antes de las 12:00; después, próximo día')
)
update public.market_products p
set research_status = 'GREEN', purchasable = true, updated_at = now()
from verified v
where p.slug = v.slug and p.image_status = 'published' and p.public_image_url is not null;

with verified(slug, price_usd, description, eta_text) as (values
  ('muslos-pollo-10-lb', 19.49::numeric, 'Paquete familiar de pollo de 10 lb.', 'Entrega express 24 h'),
  ('frijol-negro-1kg', 1.92::numeric, 'Frijol negro Meu Biju en bolsa de 1 kg.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('azucar-blanca-1kg', 2.07::numeric, 'Azúcar blanca cristalina Energy en bolsa de 1 kg.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('atun-170g', 1.52::numeric, 'Filete de atún Mar del Pacífico en aceite vegetal, lata de 170 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('jamonilla-cerdo-320g', 2.61::numeric, 'Jamonilla de cerdo Oderich en lata de 320 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('mantequilla-200g', 1.61::numeric, 'Mantequilla Combi en envase de 200 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('pasta-tomate-400g', 1.53::numeric, 'Pasta de tomate Vima 28/30 en envase de 400 g.', 'Mismo día antes de las 12:00; después, próximo día'),
  ('penne-rigate-500g', 1.07::numeric, 'Penne Rigate Ria Via en paquete de 500 g.', 'Mismo día antes de las 12:00; después, próximo día')
)
insert into public.market_public_catalog
  (product_id, slug, name, kind, category, description, presentation, composition, substitution_policy, price_usd, available, eta_text, image_url, source_checked_at, valid_until)
select p.id, p.slug, p.name, p.kind, p.category, v.description, p.presentation, p.composition,
       p.substitution_policy, v.price_usd, true, v.eta_text, p.public_image_url, now(), now() + interval '24 hours'
from verified v join public.market_products p on p.slug = v.slug
where p.purchasable and p.image_status = 'published' and p.public_image_url is not null
on conflict (product_id) do update set
  description = excluded.description,
  presentation = excluded.presentation,
  price_usd = excluded.price_usd,
  available = true,
  eta_text = excluded.eta_text,
  image_url = excluded.image_url,
  source_checked_at = excluded.source_checked_at,
  valid_until = excluded.valid_until,
  updated_at = now();

-- Fallos de revalidación: se conservan investigados pero no comprables.
-- Aceite: la variante de 1 L cambió a 3.53 USD y está sin existencias.
update public.market_supplier_offers o
set source_url = 'https://combitos.com/producto/aceite-vegetal-sumavi-1lt/', source_price = 3.53,
    availability = 'unavailable', status = 'blocked', is_primary = false,
    last_checked_at = now(), valid_until = null, updated_at = now()
from public.market_products p where p.id = o.product_id and p.slug = 'aceite-vegetal-1l';

insert into public.market_supplier_observations
  (offer_id, observed_at, http_status, resolved_url, source_reachable, price, currency, availability, presentation, eta_text, extraction_confidence, snapshot)
select o.id, now(), 200, 'https://combitos.com/producto/aceite-vegetal-sumavi-1lt/', true, 3.53, 'USD', 'unavailable', '1 L',
       'Mismo día antes de las 12:00; después, próximo día', 100,
       '{"batch":"CUYANA-FOOD-004","failure":"price_changed_and_out_of_stock"}'::jsonb
from public.market_supplier_offers o join public.market_products p on p.id=o.product_id where p.slug='aceite-vegetal-1l';

update public.market_supplier_offers o set status='blocked',availability='unknown',is_primary=false,last_checked_at=now(),valid_until=null,updated_at=now()
from public.market_products p where p.id=o.product_id and p.slug in ('combo-aseo-personal','huevos-30-unidades');

insert into public.market_supplier_observations
  (offer_id, observed_at, http_status, resolved_url, source_reachable, price, currency, availability, presentation, eta_text, extraction_confidence, snapshot)
select o.id, now(), case when p.slug='combo-aseo-personal' then 200 else null end, o.source_url,
       p.slug='combo-aseo-personal', null, 'USD', 'unknown', o.presentation, o.eta_text, 0,
       jsonb_build_object('batch','CUYANA-FOOD-004','failure',case when p.slug='combo-aseo-personal' then 'exact_composition_and_price_not_found' else 'supplier_page_not_reliably_reachable' end)
from public.market_supplier_offers o join public.market_products p on p.id=o.product_id
where p.slug in ('combo-aseo-personal','huevos-30-unidades');

update public.market_products set purchasable=false,updated_at=now()
where slug in ('aceite-vegetal-1l','combo-aseo-personal','huevos-30-unidades','combo-compra-de-mama','ventilador-recargable-doubledow');

update public.market_public_catalog set available=false,valid_until=null,updated_at=now()
where slug in ('aceite-vegetal-1l','combo-aseo-personal','huevos-30-unidades','combo-compra-de-mama','ventilador-recargable-doubledow');

commit;
