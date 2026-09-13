-- Cuarto combo vigente y relaciones normalizadas de componentes conocidas.
with supplier as (select id from public.market_suppliers where slug = 'alawao')
insert into public.market_products (slug,name,kind,category,summary,presentation,composition,substitution_policy,research_status,purchasable,image_status)
values ('combo-kiosko','Combo Kiosko','bundle','alimentos','Despensa y proteínas para una compra familiar amplia.','12 líneas: pollo, cerdo, jamón, leche, Choco Milk, aceite, frijoles, café, arroz, mayonesa, azúcar y atún.',
  '["pollo 10 lb","cerdo 2 kg","2 jamones 1.5 lb","leche en polvo 1 kg","Choco Milk 625 g","aceite 900 ml","frijoles 500 g","café 200 g","arroz 1 kg","mayonesa 200 g","azúcar 1 kg","2 atunes 74 g"]'::jsonb,
  'Las marcas y algunos cortes pueden variar según disponibilidad; confirmar antes de pagar.','GREEN',true,'brief_ready')
on conflict (slug) do update set research_status='GREEN',purchasable=true,composition=excluded.composition,presentation=excluded.presentation,updated_at=now();

insert into public.market_supplier_offers (product_id,supplier_id,source_url,source_price,currency,supplier_shipping,availability,presentation,composition,destination_scope,eta_text,extraction_confidence,observed_at,last_checked_at,valid_until,status,is_primary)
select p.id,s.id,'https://alawao.com/producto/combo-kiosko/',168.95,'USD',0,'available',p.presentation,p.composition,'{"country":"CU","confirm_address_before_payment":true}'::jsonb,'Entrega express 24 h',95,now(),now(),now()+interval '24 hours','approved',true
from public.market_products p cross join public.market_suppliers s where p.slug='combo-kiosko' and s.slug='alawao'
on conflict (product_id,supplier_id,source_url) do update set source_price=excluded.source_price,availability='available',last_checked_at=now(),valid_until=now()+interval '24 hours',status='approved',is_primary=true;

insert into public.market_supplier_observations (offer_id,http_status,resolved_url,source_reachable,price,currency,availability,presentation,composition,supplier_shipping,destination_scope,eta_text,extraction_confidence,snapshot)
select o.id,200,o.source_url,true,o.source_price,o.currency,o.availability,o.presentation,o.composition,o.supplier_shipping,o.destination_scope,o.eta_text,95,'{"method":"manual_web_revalidation","date":"2026-09-13"}'::jsonb
from public.market_supplier_offers o join public.market_products p on p.id=o.product_id where p.slug='combo-kiosko'
and not exists (select 1 from public.market_supplier_observations x where x.offer_id=o.id);

insert into public.market_public_catalog (product_id,slug,name,kind,category,description,presentation,composition,substitution_policy,price_usd,available,eta_text,image_url,source_checked_at,valid_until)
select id,slug,name,kind,'alimentos',summary,presentation,composition,substitution_policy,194.29,true,'Entrega express 24 h',null,now(),now()+interval '24 hours'
from public.market_products where slug='combo-kiosko'
on conflict (product_id) do update set price_usd=excluded.price_usd,available=true,source_checked_at=now(),valid_until=now()+interval '24 hours',composition=excluded.composition,updated_at=now();

insert into public.market_bundle_items (bundle_id,product_id,quantity,unit,notes)
select b.id,p.id,x.quantity,x.unit,x.notes
from (values
  ('combo-basicos-de-casa','huevos-30-unidades',1::numeric,'cartón','Componente equivalente; marca sujeta a proveedor'),
  ('combo-basicos-de-casa','arroz-blanco-dona-kuca-1kg',1::numeric,'kg','Componente equivalente; marca sujeta a proveedor'),
  ('combo-proteina-familiar','huevos-30-unidades',1::numeric,'cartón','30 unidades'),
  ('combo-proteina-mixta','huevos-30-unidades',7::numeric,'unidad','Parte del combo'),
  ('combo-kiosko','arroz-blanco-dona-kuca-1kg',1::numeric,'kg','Marca sujeta a disponibilidad'),
  ('combo-kiosko','cafe-la-llave-284g',1::numeric,'paquete','Equivalente de 200 g; marca sujeta a disponibilidad'),
  ('combo-kiosko','atun-170g',2::numeric,'bolsa','Presentación del combo: 74 g cada una')
) as x(bundle_slug,product_slug,quantity,unit,notes)
join public.market_products b on b.slug=x.bundle_slug
join public.market_products p on p.slug=x.product_slug
on conflict (bundle_id,product_id) do update set quantity=excluded.quantity,unit=excluded.unit,notes=excluded.notes;
