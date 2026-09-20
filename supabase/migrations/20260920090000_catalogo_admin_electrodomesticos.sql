-- Catálogo administrado a mano (electrodomésticos con proveedor directo,
-- p.ej. Adonys por WhatsApp), a diferencia de las arroceras que vienen de
-- Revolico y se revalidan cada 24h. Reutiliza market_products/
-- market_public_catalog (mismo contrato que ya lee la tienda) en vez de una
-- tabla paralela, marcando cada fila con source='admin' para que la
-- revalidación futura de Revolico nunca las toque.

begin;

alter table public.market_products
  add column if not exists source text not null default 'market';
alter table public.market_products
  drop constraint if exists market_products_source_check;
alter table public.market_products
  add constraint market_products_source_check check (source in ('market','admin'));

alter table public.market_products
  add column if not exists admin_status text not null default 'publicado';
alter table public.market_products
  drop constraint if exists market_products_admin_status_check;
alter table public.market_products
  add constraint market_products_admin_status_check check (admin_status in ('publicado','oculto'));

alter table public.market_public_catalog
  add column if not exists track_stock boolean not null default false;
alter table public.market_public_catalog
  add column if not exists stock_quantity integer;

-- Bucket para fotos subidas/generadas desde el panel. Público de lectura
-- (igual que zaldivar-productos): la protección real es que solo el admin
-- puede escribir.
insert into storage.buckets (id, name, public)
values ('cuyana-productos', 'cuyana-productos', true)
on conflict (id) do nothing;

drop policy if exists "cuyana_productos_lectura_publica" on storage.objects;
create policy "cuyana_productos_lectura_publica" on storage.objects
  for select using (bucket_id = 'cuyana-productos');

drop policy if exists "cuyana_productos_admin_escribe" on storage.objects;
create policy "cuyana_productos_admin_escribe" on storage.objects
  for insert to authenticated with check (bucket_id = 'cuyana-productos' and public.es_admin());

drop policy if exists "cuyana_productos_admin_actualiza" on storage.objects;
create policy "cuyana_productos_admin_actualiza" on storage.objects
  for update to authenticated using (bucket_id = 'cuyana-productos' and public.es_admin());

drop policy if exists "cuyana_productos_admin_borra" on storage.objects;
create policy "cuyana_productos_admin_borra" on storage.objects
  for delete to authenticated using (bucket_id = 'cuyana-productos' and public.es_admin());

-- Genera un slug único a partir de categoría + nombre.
create or replace function public.admin_catalogo_generar_slug(p_category text, p_name text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_base text;
  v_slug text;
  v_suffix int := 0;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;

  v_base := lower(p_category || '-' || p_name);
  v_base := translate(v_base, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN');
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := trim(both '-' from v_base);
  if v_base = '' then v_base := 'producto'; end if;

  v_slug := v_base;
  while exists(select 1 from public.market_products where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  end loop;
  return v_slug;
end;
$function$;

-- Lista solo los productos de fuente 'admin' (los de Revolico/FOOD se
-- siguen gestionando desde /admin/abastecimiento, esto no los toca).
create or replace function public.admin_catalogo_listar_productos()
returns table (
  product_id uuid,
  slug text,
  name text,
  description text,
  category text,
  price_usd numeric,
  image_url text,
  track_stock boolean,
  stock_quantity integer,
  admin_status text,
  available boolean,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path to 'public'
as $function$
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  return query
    select mp.id, c.slug, c.name, c.description, c.category, c.price_usd, c.image_url,
           c.track_stock, c.stock_quantity, mp.admin_status, c.available, mp.created_at
    from public.market_products mp
    join public.market_public_catalog c on c.product_id = mp.id
    where mp.source = 'admin'
    order by mp.created_at desc;
end;
$function$;

create or replace function public.admin_catalogo_crear_producto(
  p_slug text,
  p_name text,
  p_description text,
  p_category text,
  p_price_usd numeric,
  p_image_url text,
  p_track_stock boolean,
  p_stock_quantity integer
)
returns public.market_public_catalog
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_product_id uuid;
  v_available boolean;
  v_row public.market_public_catalog;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;

  insert into public.market_products (
    slug, name, kind, category, research_status, purchasable, image_status,
    public_image_url, source, admin_status
  ) values (
    p_slug, p_name, 'product', p_category, 'GREEN', true, 'published',
    p_image_url, 'admin', 'publicado'
  ) returning id into v_product_id;

  v_available := (not p_track_stock) or coalesce(p_stock_quantity, 0) > 0;

  insert into public.market_public_catalog (
    product_id, slug, name, kind, category, description, price_usd, available,
    image_url, source_checked_at, valid_until, updated_at, track_stock, stock_quantity
  ) values (
    v_product_id, p_slug, p_name, 'product', p_category, p_description, p_price_usd, v_available,
    p_image_url, now(), now() + interval '10 years', now(), p_track_stock, p_stock_quantity
  ) returning * into v_row;

  return v_row;
end;
$function$;

create or replace function public.admin_catalogo_actualizar_producto(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_category text,
  p_price_usd numeric,
  p_image_url text,
  p_track_stock boolean,
  p_stock_quantity integer,
  p_admin_status text
)
returns public.market_public_catalog
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_available boolean;
  v_row public.market_public_catalog;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  if p_admin_status not in ('publicado', 'oculto') then raise exception 'estado inválido'; end if;
  if not exists (select 1 from public.market_products where id = p_product_id and source = 'admin') then
    raise exception 'producto no encontrado' using errcode = 'P0002';
  end if;

  update public.market_products
    set name = p_name, category = p_category, public_image_url = p_image_url,
        admin_status = p_admin_status, updated_at = now()
    where id = p_product_id;

  v_available := (p_admin_status = 'publicado') and ((not p_track_stock) or coalesce(p_stock_quantity, 0) > 0);

  update public.market_public_catalog
    set name = p_name, category = p_category, description = p_description,
        price_usd = p_price_usd, image_url = p_image_url, track_stock = p_track_stock,
        stock_quantity = p_stock_quantity, available = v_available,
        valid_until = now() + interval '10 years', updated_at = now()
    where product_id = p_product_id
    returning * into v_row;

  return v_row;
end;
$function$;

create or replace function public.admin_catalogo_actualizar_estado_producto(p_product_id uuid, p_status text)
returns public.market_public_catalog
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_track_stock boolean;
  v_stock integer;
  v_available boolean;
  v_row public.market_public_catalog;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  if p_status not in ('publicado', 'oculto') then raise exception 'estado inválido'; end if;

  update public.market_products set admin_status = p_status, updated_at = now()
    where id = p_product_id and source = 'admin';

  select track_stock, stock_quantity into v_track_stock, v_stock
    from public.market_public_catalog where product_id = p_product_id;

  v_available := (p_status = 'publicado') and ((not v_track_stock) or coalesce(v_stock, 0) > 0);

  update public.market_public_catalog set available = v_available, updated_at = now()
    where product_id = p_product_id
    returning * into v_row;

  return v_row;
end;
$function$;

create or replace function public.admin_catalogo_actualizar_estado_productos_lote(p_ids uuid[], p_status text)
returns setof public.market_public_catalog
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  if p_status not in ('publicado', 'oculto') then raise exception 'estado inválido'; end if;

  update public.market_products set admin_status = p_status, updated_at = now()
    where id = any(p_ids) and source = 'admin';

  return query
    update public.market_public_catalog c
    set available = (p_status = 'publicado') and ((not c.track_stock) or coalesce(c.stock_quantity, 0) > 0),
        updated_at = now()
    where c.product_id = any(p_ids)
      and c.product_id in (select id from public.market_products where source = 'admin')
    returning c.*;
end;
$function$;

create or replace function public.admin_catalogo_eliminar_producto(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  delete from public.market_public_catalog
    where product_id = p_product_id
      and product_id in (select id from public.market_products where source = 'admin');
  delete from public.market_products where id = p_product_id and source = 'admin';
end;
$function$;

create or replace function public.admin_catalogo_eliminar_productos_lote(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  delete from public.market_public_catalog
    where product_id = any(p_ids)
      and product_id in (select id from public.market_products where source = 'admin');
  delete from public.market_products where id = any(p_ids) and source = 'admin';
end;
$function$;

commit;
