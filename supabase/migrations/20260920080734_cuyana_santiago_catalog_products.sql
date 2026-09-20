-- CUYANA-SANTIAGO-001: cinco productos de inventario local con imagen propia.
-- La fuente primaria es la fotografía y la confirmación directa del proveedor;
-- por eso no se inventan voltaje, autonomía, eficiencia ni garantía.

begin;

alter table public.market_public_catalog
  add column if not exists delivery_location text,
  add column if not exists data_quality_note text;

insert into public.market_suppliers (
  slug, name, website_url, priority, status, direct_to_recipient,
  via_cuyana_hub, notes
) values (
  'inventario-santiago-cuyana',
  'Inventario local Santiago — CUYANA',
  'https://cuyana.casavivadecuba.com/contacto',
  10,
  'active',
  true,
  false,
  'Oferta confirmada directamente por el proveedor mediante fotografías y precios enviados el 20/09/2026. Stock, garantía y mensajería se reconfirman antes de cobrar.'
)
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();

insert into public.market_products (
  slug, name, kind, category, summary, presentation, composition,
  substitution_policy, research_status, purchasable, image_status,
  public_image_url
) values
  (
    'cafetera-eko-eko401m-01',
    'Cafetera eléctrica EKO EKO401M-01 de 6 tazas',
    'product', 'electrodomesticos',
    'Cafetera eléctrica tipo moka para preparar hasta 6 tazas, con apagado automático y base eléctrica.',
    'Modelo EKO401M-01 · 6 tazas · 550 W anunciados', null,
    'No sustituir marca, modelo, capacidad, color ni potencia sin confirmación del cliente.',
    'GREEN', true, 'published',
    '/catalog/electrodomesticos/cafetera-eko-eko401m-01/hero.webp'
  ),
  (
    'aire-acondicionado-split-2-toneladas',
    'Aire acondicionado split de 2 toneladas',
    'product', 'electrodomesticos',
    'Conjunto de aire acondicionado split con unidad interior y condensadora exterior. Marca, voltaje, eficiencia e instalación se confirman antes de comprar.',
    '2 toneladas · unidad interior + unidad exterior', null,
    'No sustituir capacidad ni componentes; confirmar marca, voltaje e instalación con el cliente.',
    'GREEN', true, 'published',
    '/catalog/electrodomesticos/aire-acondicionado-split-2-toneladas/hero.webp'
  ),
  (
    'ventilador-recargable-f38',
    'Ventilador recargable F38 con pantalla digital',
    'product', 'electrodomesticos',
    'Ventilador recargable de mesa modelo F38, con pantalla digital y controles frontales. La capacidad de batería de 40.000 mAh es la anunciada por el proveedor.',
    'Modelo F38 · batería anunciada de 40.000 mAh', null,
    'No sustituir modelo, diseño ni capacidad anunciada sin confirmación del cliente.',
    'GREEN', true, 'published',
    '/catalog/electrodomesticos/ventilador-recargable-f38/hero.webp'
  ),
  (
    'luminaria-solar-calle-800w',
    'Luminaria solar de calle con panel y control remoto — 800 W anunciados',
    'product', 'electrodomesticos',
    'Kit de iluminación solar exterior con lámpara LED, panel solar separado y control remoto. Los 800 W corresponden a la potencia anunciada por el proveedor.',
    'Lámpara LED + panel solar + control remoto',
    '["Luminaria LED exterior","Panel solar separado","Control remoto"]'::jsonb,
    'No sustituir el kit ni retirar componentes sin confirmación del cliente.',
    'GREEN', true, 'published',
    '/catalog/electrodomesticos/luminaria-solar-calle-800w/hero.webp'
  ),
  (
    'ventilador-recargable-yj-2219',
    'Ventilador recargable telescópico YJ-2219',
    'product', 'electrodomesticos',
    'Ventilador recargable telescópico modelo YJ-2219, ajustable para usar sobre mesa o extendido como pedestal.',
    'Modelo YJ-2219 · altura ajustable', null,
    'No sustituir modelo, color o configuración sin confirmación del cliente.',
    'GREEN', true, 'published',
    '/catalog/electrodomesticos/ventilador-recargable-yj-2219/hero.webp'
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  presentation = excluded.presentation,
  composition = excluded.composition,
  substitution_policy = excluded.substitution_policy,
  research_status = excluded.research_status,
  purchasable = excluded.purchasable,
  image_status = excluded.image_status,
  public_image_url = excluded.public_image_url,
  updated_at = now();

insert into public.market_public_catalog (
  product_id, slug, name, kind, category, description, presentation,
  composition, substitution_policy, price_usd, available, eta_text,
  image_url, source_checked_at, valid_until, delivery_location,
  data_quality_note, updated_at
)
select
  p.id, p.slug, p.name, p.kind, 'electrodomesticos', p.summary,
  p.presentation, p.composition, p.substitution_policy,
  case p.slug
    when 'cafetera-eko-eko401m-01' then 35.00
    when 'aire-acondicionado-split-2-toneladas' then 580.00
    when 'ventilador-recargable-f38' then 80.00
    when 'luminaria-solar-calle-800w' then 90.00
    when 'ventilador-recargable-yj-2219' then 70.00
  end,
  true,
  'Entrega y mensajería por confirmar',
  p.public_image_url,
  now(),
  null,
  'Santiago de Cuba',
  'Producto y precio confirmados por fotografía del proveedor. Stock, garantía y detalles no visibles se confirman antes del pago.',
  now()
from public.market_products p
where p.slug in (
  'cafetera-eko-eko401m-01',
  'aire-acondicionado-split-2-toneladas',
  'ventilador-recargable-f38',
  'luminaria-solar-calle-800w',
  'ventilador-recargable-yj-2219'
)
on conflict (product_id) do update set
  slug = excluded.slug,
  name = excluded.name,
  kind = excluded.kind,
  category = excluded.category,
  description = excluded.description,
  presentation = excluded.presentation,
  composition = excluded.composition,
  substitution_policy = excluded.substitution_policy,
  price_usd = excluded.price_usd,
  available = excluded.available,
  eta_text = excluded.eta_text,
  image_url = excluded.image_url,
  source_checked_at = excluded.source_checked_at,
  valid_until = excluded.valid_until,
  delivery_location = excluded.delivery_location,
  data_quality_note = excluded.data_quality_note,
  updated_at = excluded.updated_at;

insert into public.commercial_rates (
  id, gyd_per_usd, source, as_of, expires_at, updated_by, updated_at
) values (
  'gyd_usd', 275, 'Referencia comercial operativa CUYANA', now(),
  now() + interval '7 days', 'CUYANA-SANTIAGO-001', now()
)
on conflict (id) do update set
  gyd_per_usd = excluded.gyd_per_usd,
  source = excluded.source,
  as_of = excluded.as_of,
  expires_at = excluded.expires_at,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

commit;
