-- Facturas: mismo sistema que ya funciona en Zaldívar, adaptado a Cuyana
-- (esquema public, es_admin(), sin nada específico de Alemania — aquí no
-- hay IVA que declarar, así que el impuesto queda como campo libre en 0%
-- por defecto en vez de forzado).
--
-- El perfil del negocio nace vacío a propósito: hoy no hay IBAN, dirección
-- ni nota legal reales que poner. Se llena desde /admin/facturas/perfil
-- cuando el negocio los tenga — a diferencia de Zaldívar, aquí si hay una
-- pantalla para editarlo, no hay que tocar la base a mano.

begin;

create table if not exists public.business_profile (
  id integer primary key default 1,
  legal_name text not null default 'Cuyana',
  address_line text not null default '',
  postal_city text not null default '',
  phone text not null default '',
  email text not null default '',
  tax_note text not null default '',
  iban text not null default '',
  bic text not null default '',
  bank_name text not null default '',
  payment_reference_default text not null default '',
  default_legal_notice text not null default '',
  default_shipping_notice text not null default '',
  updated_at timestamptz not null default now(),
  constraint business_profile_single_row check (id = 1)
);
insert into public.business_profile (id) values (1) on conflict (id) do nothing;

alter table public.business_profile enable row level security;
drop policy if exists "business_profile_admin" on public.business_profile;
create policy "business_profile_admin" on public.business_profile
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create sequence if not exists public.invoice_number_seq;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text,
  invoice_date date not null default current_date,
  delivery_date date not null default current_date,
  issuer jsonb not null default '{}'::jsonb,
  recipient jsonb not null default '{}'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  net_amount numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  currency text not null default 'USD' check (currency in ('USD', 'GYD', 'CUP')),
  legal_notice text not null default '',
  shipping_notice text not null default '',
  payment_method text not null default '',
  iban text not null default '',
  bic text not null default '',
  bank_name text not null default '',
  payment_reference text not null default '',
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'pagado')),
  source_type text not null default 'manual' check (source_type in ('pedido', 'captura', 'manual')),
  -- id como texto, no uuid: una remesa vive en `orders` (id entero) y un
  -- pedido de tienda en `store_orders` (id uuid) — dos formas distintas.
  source_order_id text,
  source_order_kind text check (source_order_kind in ('remesa', 'tienda')),
  source_image_path text,
  status text not null default 'borrador' check (status in ('borrador', 'emitida')),
  pdf_path text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
drop policy if exists "invoices_admin" on public.invoices;
create policy "invoices_admin" on public.invoices
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create or replace function public.next_invoice_number()
returns text
language sql
as $function$
  select 'CUY-FAC-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0');
$function$;

create or replace function public.admin_obtener_perfil_negocio()
returns public.business_profile
language sql
stable
security definer
set search_path to 'public'
as $function$
  select * from public.business_profile where id = 1 and public.es_admin();
$function$;

create or replace function public.admin_actualizar_perfil_negocio(
  p_legal_name text, p_address_line text, p_postal_city text, p_phone text, p_email text,
  p_tax_note text, p_iban text, p_bic text, p_bank_name text, p_payment_reference_default text,
  p_default_legal_notice text, p_default_shipping_notice text
)
returns public.business_profile
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.business_profile;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  update public.business_profile set
    legal_name = p_legal_name, address_line = p_address_line, postal_city = p_postal_city,
    phone = p_phone, email = p_email, tax_note = p_tax_note, iban = p_iban, bic = p_bic,
    bank_name = p_bank_name, payment_reference_default = p_payment_reference_default,
    default_legal_notice = p_default_legal_notice, default_shipping_notice = p_default_shipping_notice,
    updated_at = now()
  where id = 1
  returning * into v_row;
  return v_row;
end;
$function$;

create or replace function public.admin_siguiente_numero_factura()
returns text
language sql
security definer
set search_path to 'public'
as $function$
  select case when public.es_admin() then public.next_invoice_number() else null end;
$function$;

create or replace function public.admin_listar_facturas()
returns setof public.invoices
language plpgsql
security definer
stable
set search_path to 'public'
as $function$
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  return query select * from public.invoices order by created_at desc;
end;
$function$;

create or replace function public.admin_guardar_factura(
  p_id uuid, p_number text, p_invoice_date date, p_delivery_date date,
  p_issuer jsonb, p_recipient jsonb, p_line_items jsonb,
  p_net_amount numeric, p_tax_rate numeric, p_tax_amount numeric, p_total_amount numeric,
  p_currency text, p_legal_notice text, p_shipping_notice text, p_payment_method text,
  p_iban text, p_bic text, p_bank_name text, p_payment_reference text, p_payment_status text,
  p_source_type text, p_source_order_id text, p_source_order_kind text, p_source_image_path text,
  p_status text
)
returns public.invoices
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.invoices;
  v_number text;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;

  v_number := nullif(trim(p_number), '');
  if p_status = 'emitida' and v_number is null then
    v_number := public.next_invoice_number();
  end if;

  if p_id is null then
    insert into public.invoices (
      number, invoice_date, delivery_date, issuer, recipient, line_items,
      net_amount, tax_rate, tax_amount, total_amount, currency,
      legal_notice, shipping_notice, payment_method, iban, bic, bank_name, payment_reference,
      payment_status, source_type, source_order_id, source_order_kind, source_image_path, status, created_by
    ) values (
      v_number, p_invoice_date, p_delivery_date, p_issuer, p_recipient, p_line_items,
      p_net_amount, p_tax_rate, p_tax_amount, p_total_amount, p_currency,
      p_legal_notice, p_shipping_notice, p_payment_method, p_iban, p_bic, p_bank_name, p_payment_reference,
      p_payment_status, p_source_type, p_source_order_id, p_source_order_kind, p_source_image_path, p_status, auth.uid()
    ) returning * into v_row;
  else
    update public.invoices set
      number = v_number, invoice_date = p_invoice_date, delivery_date = p_delivery_date,
      issuer = p_issuer, recipient = p_recipient, line_items = p_line_items,
      net_amount = p_net_amount, tax_rate = p_tax_rate, tax_amount = p_tax_amount, total_amount = p_total_amount,
      currency = p_currency, legal_notice = p_legal_notice, shipping_notice = p_shipping_notice,
      payment_method = p_payment_method, iban = p_iban, bic = p_bic, bank_name = p_bank_name,
      payment_reference = p_payment_reference, payment_status = p_payment_status,
      status = p_status, updated_at = now()
    where id = p_id
    returning * into v_row;
  end if;

  return v_row;
end;
$function$;

create or replace function public.admin_marcar_pdf_factura(p_id uuid, p_pdf_path text)
returns public.invoices
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.invoices;
begin
  if not public.es_admin() then raise exception 'no autorizado' using errcode = '28000'; end if;
  update public.invoices set pdf_path = p_pdf_path, status = 'emitida', updated_at = now()
  where id = p_id returning * into v_row;
  return v_row;
end;
$function$;

create or replace function public.factura_publica(p_id uuid)
returns public.invoices
language sql
stable
security definer
set search_path to 'public'
as $function$
  select * from public.invoices where id = p_id and status = 'emitida';
$function$;

-- Bucket privado para los PDFs (igual que zaldivar-documentos): solo se
-- entrega por URL firmada, nunca de lectura pública directa.
insert into storage.buckets (id, name, public)
values ('cuyana-documentos', 'cuyana-documentos', false)
on conflict (id) do nothing;

drop policy if exists "cuyana_documentos_admin_todo" on storage.objects;
create policy "cuyana_documentos_admin_todo" on storage.objects
  for all to authenticated
  using (bucket_id = 'cuyana-documentos' and public.es_admin())
  with check (bucket_id = 'cuyana-documentos' and public.es_admin());

-- Sin esto, /factura/[id] (público, sin sesión) no puede ni pedir la URL
-- firmada del PDF de una factura ya emitida.
drop policy if exists "cuyana_documentos_lee_factura_emitida" on storage.objects;
create policy "cuyana_documentos_lee_factura_emitida" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'cuyana-documentos'
    and exists (select 1 from public.invoices i where i.pdf_path = objects.name and i.status = 'emitida')
  );

commit;
