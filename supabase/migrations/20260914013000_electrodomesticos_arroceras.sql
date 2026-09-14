-- CUYANA-ELECTRO-001: primera categoría propia de electrodomésticos.
-- Cuatro arroceras revalidadas el 13/09/2026. El precio público conserva la
-- regla comercial CUYANA: costo observado × 1.15. La mensajería queda fuera
-- del markup cuando depende del destino.

begin;

-- El catálogo público nació con alimentos/hogar. Electrodomésticos tiene flujo
-- comercial propio en CUYANA Market y por eso merece categoría explícita.
alter table public.market_public_catalog
  drop constraint if exists market_public_catalog_category_check;
alter table public.market_public_catalog
  add constraint market_public_catalog_category_check
  check (category in ('alimentos', 'hogar', 'electrodomesticos'));

insert into public.market_suppliers (
  slug, name, website_url, priority, status, direct_to_recipient, via_cuyana_hub, notes
) values (
  'revolico',
  'Revolico',
  'https://www.revolico.com/',
  40,
  'watch',
  true,
  true,
  'Marketplace local. Cada oferta requiere revalidación manual de vendedor, stock, precio, garantía y mensajería antes de ejecutar la compra.'
)
on conflict (slug) do update set
  name = excluded.name,
  website_url = excluded.website_url,
  notes = excluded.notes,
  updated_at = now();

-- 1. EKO 1.8 L
insert into public.market_products (
  slug, name, kind, category, summary, presentation, substitution_policy,
  research_status, purchasable, image_status, public_image_url
) values (
  'arrocera-eko-18l',
  'Arrocera EKO 1.8 L',
  'product',
  'electrodomesticos',
  'Arrocera eléctrica familiar de 1.8 L para uso diario, con operación sencilla.',
  '1.8 L',
  'No sustituir marca, capacidad ni modelo sin confirmación del cliente.',
  'GREEN', true, 'published',
  'https://img1.elyerromenu.com/images/nef-envio/olla-arrocera-electrica-eko-1-8-l-6/img.webp'
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  presentation = excluded.presentation,
  substitution_policy = excluded.substitution_policy,
  research_status = excluded.research_status,
  purchasable = excluded.purchasable,
  image_status = excluded.image_status,
  public_image_url = excluded.public_image_url,
  updated_at = now();

insert into public.market_supplier_offers (
  product_id, supplier_id, source_url, source_price, currency,
  availability, presentation, destination_scope, eta_text,
  extraction_confidence, observed_at, last_checked_at, valid_until,
  status, is_primary, snapshot_hash
)
select p.id, s.id,
  'https://www.revolico.com/item/olla-arrocera-blanca-y-negra-de-18-l-eko-57190094',
  30.00, 'USD', 'available', '1.8 L',
  '{"coverage":"La Habana","delivery":"según anuncio; confirmar zona"}'::jsonb,
  'Entrega en La Habana; confirmar zona antes de comprar',
  90, now(), now(), now() + interval '24 hours', 'approved', true,
  md5('arrocera-eko-18l|30.00|available|1.8L')
from public.market_products p
join public.market_suppliers s on s.slug = 'revolico'
where p.slug = 'arrocera-eko-18l'
on conflict (product_id, supplier_id, source_url) do update set
  source_price = excluded.source_price,
  availability = excluded.availability,
  presentation = excluded.presentation,
  destination_scope = excluded.destination_scope,
  eta_text = excluded.eta_text,
  extraction_confidence = excluded.extraction_confidence,
  observed_at = excluded.observed_at,
  last_checked_at = excluded.last_checked_at,
  valid_until = excluded.valid_until,
  status = excluded.status,
  is_primary = excluded.is_primary,
  snapshot_hash = excluded.snapshot_hash,
  updated_at = now();

-- 2. DESMATT KEC-118 1.8 L
insert into public.market_products (
  slug, name, kind, category, summary, presentation, substitution_policy,
  research_status, purchasable, image_status, public_image_url
) values (
  'arrocera-desmatt-kec-118-18l',
  'Arrocera DESMATT KEC-118 1.8 L',
  'product',
  'electrodomesticos',
  'Arrocera familiar de 1.8 L y 700 W, con funcionamiento simple, accesorios incluidos y mantenimiento de calor.',
  '1.8 L · 700 W · 110V/60Hz',
  'No sustituir marca, modelo, voltaje ni capacidad sin confirmación del cliente.',
  'GREEN', true, 'published',
  '/catalog/electrodomesticos/arrocera-desmatt-kec-118-18l/hero.svg'
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  presentation = excluded.presentation,
  substitution_policy = excluded.substitution_policy,
  research_status = excluded.research_status,
  purchasable = excluded.purchasable,
  image_status = excluded.image_status,
  public_image_url = excluded.public_image_url,
  updated_at = now();

insert into public.market_supplier_offers (
  product_id, supplier_id, source_url, source_price, currency,
  availability, presentation, destination_scope, eta_text,
  extraction_confidence, observed_at, last_checked_at, valid_until,
  status, is_primary, snapshot_hash
)
select p.id, s.id,
  'https://www.revolico.com/item/olla-arrocera-desmatt-18l-para-arroz-suelto-arrocera-electrica-desmatt-18l-facil-operacion-57334537',
  30.00, 'USD', 'available', '1.8 L · 700 W · 110V/60Hz',
  '{"coverage":"La Habana","warranty":"30 días","delivery":"mensajería con 24 h de anticipación"}'::jsonb,
  'Mensajería con 24 h de anticipación',
  98, now(), now(), now() + interval '24 hours', 'approved', true,
  md5('arrocera-desmatt-kec-118-18l|30.00|available|1.8L|700W|110V')
from public.market_products p
join public.market_suppliers s on s.slug = 'revolico'
where p.slug = 'arrocera-desmatt-kec-118-18l'
on conflict (product_id, supplier_id, source_url) do update set
  source_price = excluded.source_price,
  availability = excluded.availability,
  presentation = excluded.presentation,
  destination_scope = excluded.destination_scope,
  eta_text = excluded.eta_text,
  extraction_confidence = excluded.extraction_confidence,
  observed_at = excluded.observed_at,
  last_checked_at = excluded.last_checked_at,
  valid_until = excluded.valid_until,
  status = excluded.status,
  is_primary = excluded.is_primary,
  snapshot_hash = excluded.snapshot_hash,
  updated_at = now();

-- 3. MAF 1.2 L con vaporera
insert into public.market_products (
  slug, name, kind, category, summary, presentation, substitution_policy,
  research_status, purchasable, image_status, public_image_url
) values (
  'arrocera-maf-12l-vaporera',
  'Arrocera MAF 1.2 L con vaporera',
  'product',
  'electrodomesticos',
  'Arrocera compacta de 1.2 L con vaporera incluida, pensada para hogares pequeños y uso diario.',
  '1.2 L · con vaporera',
  'No sustituir marca, capacidad ni accesorios sin confirmación del cliente.',
  'GREEN', true, 'published',
  'https://pic.revolico.com/pics/4e0767730f5307cdd8fc026a9cdf36bccac86805fbc858f20b75e1890e267825_detail_desktop.jpg'
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  presentation = excluded.presentation,
  substitution_policy = excluded.substitution_policy,
  research_status = excluded.research_status,
  purchasable = excluded.purchasable,
  image_status = excluded.image_status,
  public_image_url = excluded.public_image_url,
  updated_at = now();

insert into public.market_supplier_offers (
  product_id, supplier_id, source_url, source_price, currency,
  availability, presentation, destination_scope, eta_text,
  extraction_confidence, observed_at, last_checked_at, valid_until,
  status, is_primary, snapshot_hash
)
select p.id, s.id,
  'https://www.revolico.com/item/olla-arrocera-maf-de-12-litros-en-venta-56599316',
  29.00, 'USD', 'available', '1.2 L · vaporera incluida',
  '{"coverage":"La Habana","warranty":"15 días","delivery":"mensajería con costo adicional"}'::jsonb,
  'Mensajería disponible con costo adicional',
  92, now(), now(), now() + interval '24 hours', 'approved', true,
  md5('arrocera-maf-12l-vaporera|29.00|available|1.2L')
from public.market_products p
join public.market_suppliers s on s.slug = 'revolico'
where p.slug = 'arrocera-maf-12l-vaporera'
on conflict (product_id, supplier_id, source_url) do update set
  source_price = excluded.source_price,
  availability = excluded.availability,
  presentation = excluded.presentation,
  destination_scope = excluded.destination_scope,
  eta_text = excluded.eta_text,
  extraction_confidence = excluded.extraction_confidence,
  observed_at = excluded.observed_at,
  last_checked_at = excluded.last_checked_at,
  valid_until = excluded.valid_until,
  status = excluded.status,
  is_primary = excluded.is_primary,
  snapshot_hash = excluded.snapshot_hash,
  updated_at = now();

-- 4. WEALCO 2.2 L
insert into public.market_products (
  slug, name, kind, category, summary, presentation, substitution_policy,
  research_status, purchasable, image_status, public_image_url
) values (
  'arrocera-wealco-22l',
  'Arrocera Wealco 2.2 L',
  'product',
  'electrodomesticos',
  'Arrocera familiar de gran capacidad, 2.2 L y 900 W, con cocción automática y función de mantener caliente.',
  '2.2 L · 900 W · 120V/60Hz',
  'No sustituir marca, voltaje ni capacidad sin confirmación del cliente.',
  'GREEN', true, 'published',
  'https://pub-768195fefb80411aa63fe4f44e4bee7b.r2.dev/12565/e91f4df88f5eeaef109ba3538831ccad.webp'
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  summary = excluded.summary,
  presentation = excluded.presentation,
  substitution_policy = excluded.substitution_policy,
  research_status = excluded.research_status,
  purchasable = excluded.purchasable,
  image_status = excluded.image_status,
  public_image_url = excluded.public_image_url,
  updated_at = now();

insert into public.market_supplier_offers (
  product_id, supplier_id, source_url, source_price, currency,
  availability, presentation, destination_scope, eta_text,
  extraction_confidence, observed_at, last_checked_at, valid_until,
  status, is_primary, snapshot_hash
)
select p.id, s.id,
  'https://www.revolico.com/item/olla-arrocera-22-lt-potencia-900-watts-56219835',
  34.00, 'USD', 'available', '2.2 L · 900 W · 120V/60Hz',
  '{"coverage":"La Habana","warranty":"30 días","delivery":"gratis en zonas céntricas; confirmar destino"}'::jsonb,
  'Entrega según zona; confirmar antes de comprar',
  92, now(), now(), now() + interval '24 hours', 'approved', true,
  md5('arrocera-wealco-22l|34.00|available|2.2L|900W|120V')
from public.market_products p
join public.market_suppliers s on s.slug = 'revolico'
where p.slug = 'arrocera-wealco-22l'
on conflict (product_id, supplier_id, source_url) do update set
  source_price = excluded.source_price,
  availability = excluded.availability,
  presentation = excluded.presentation,
  destination_scope = excluded.destination_scope,
  eta_text = excluded.eta_text,
  extraction_confidence = excluded.extraction_confidence,
  observed_at = excluded.observed_at,
  last_checked_at = excluded.last_checked_at,
  valid_until = excluded.valid_until,
  status = excluded.status,
  is_primary = excluded.is_primary,
  snapshot_hash = excluded.snapshot_hash,
  updated_at = now();

-- Una observación auditable por oferta: precio, disponibilidad, ficha y ETA
-- quedan congelados para comparar Antes → Ahora en la próxima revalidación.
insert into public.market_supplier_observations (
  offer_id, observed_at, http_status, resolved_url, source_reachable,
  price, currency, availability, presentation, destination_scope, eta_text,
  extraction_confidence, snapshot, snapshot_hash
)
select o.id, now(), 200, o.source_url, true,
  o.source_price, o.currency, o.availability, o.presentation,
  o.destination_scope, o.eta_text, o.extraction_confidence,
  jsonb_build_object(
    'product_slug', p.slug,
    'source_url', o.source_url,
    'price', o.source_price,
    'currency', o.currency,
    'availability', o.availability,
    'presentation', o.presentation,
    'destination_scope', o.destination_scope,
    'eta_text', o.eta_text,
    'checked_for', 'CUYANA-ELECTRO-001'
  ),
  o.snapshot_hash
from public.market_supplier_offers o
join public.market_products p on p.id = o.product_id
join public.market_suppliers s on s.id = o.supplier_id
where s.slug = 'revolico'
  and p.slug in (
    'arrocera-eko-18l',
    'arrocera-desmatt-kec-118-18l',
    'arrocera-maf-12l-vaporera',
    'arrocera-wealco-22l'
  );

-- Catálogo público sanitizado. No se exponen proveedor, URL ni costo fuente.
insert into public.market_public_catalog (
  product_id, slug, name, kind, category, description, presentation,
  composition, substitution_policy, price_usd, available, eta_text,
  image_url, source_checked_at, valid_until, updated_at
)
select p.id, p.slug, p.name, p.kind, 'electrodomesticos',
  case p.slug
    when 'arrocera-eko-18l' then 'Arrocera eléctrica familiar de 1.8 L para el uso diario, sencilla de operar y fácil de integrar en cualquier cocina.'
    when 'arrocera-desmatt-kec-118-18l' then 'Arrocera familiar de 1.8 L y 700 W. Incluye taza medidora, cuchara para arroz, cable extraíble y manual.'
    when 'arrocera-maf-12l-vaporera' then 'Arrocera compacta de 1.2 L con vaporera incluida, una opción práctica para hogares pequeños.'
    when 'arrocera-wealco-22l' then 'Arrocera familiar de 2.2 L y 900 W, con capacidad amplia para el uso diario en casa.'
  end,
  p.presentation,
  null,
  p.substitution_policy,
  case p.slug
    when 'arrocera-eko-18l' then 34.50
    when 'arrocera-desmatt-kec-118-18l' then 34.50
    when 'arrocera-maf-12l-vaporera' then 33.35
    when 'arrocera-wealco-22l' then 39.10
  end,
  true,
  case p.slug
    when 'arrocera-eko-18l' then 'Confirmar zona antes de comprar'
    when 'arrocera-desmatt-kec-118-18l' then 'Mensajería con 24 h de anticipación'
    when 'arrocera-maf-12l-vaporera' then 'Mensajería disponible'
    when 'arrocera-wealco-22l' then 'Confirmar zona antes de comprar'
  end,
  p.public_image_url,
  now(),
  now() + interval '24 hours',
  now()
from public.market_products p
where p.slug in (
  'arrocera-eko-18l',
  'arrocera-desmatt-kec-118-18l',
  'arrocera-maf-12l-vaporera',
  'arrocera-wealco-22l'
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
  updated_at = excluded.updated_at;

commit;
