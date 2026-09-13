-- CUENTAS DE CLIENTE Y VERIFICACIÓN
--
-- Para qué sirve esto, que es lo que manda en el diseño: un cliente verificado
-- puede llegar a que le entreguemos el dinero a su familiar en Cuba ANTES de
-- que él pague en Guyana. Eso es crédito. Por eso se le pide el carnet, y por
-- eso el salto a «de confianza» y su límite los decide una persona, no la app.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP como
-- `20260913015328_cuentas_de_cliente_y_verificacion`.

-- ── Quién es administrador ──────────────────────────────────────────────────
-- En una tabla y no escrito a mano dentro de cada política: dar de alta a otro
-- administrador tiene que ser una fila, no una migración.
create table if not exists public.app_admins (
  email      text primary key,
  nota       text,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

insert into public.app_admins (email, nota)
values ('ernest196391@gmail.com', 'Administrador inicial')
on conflict (email) do nothing;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins a
     where a.email = (auth.jwt() ->> 'email')
  );
$$;

-- Nadie lee la lista de administradores salvo un administrador.
drop policy if exists app_admins_solo_admin on public.app_admins;
create policy app_admins_solo_admin on public.app_admins
  for select to authenticated using (public.es_admin());

-- ── El cliente ──────────────────────────────────────────────────────────────
create table if not exists public.customer_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  -- sin_verificar → verificado (palomita) → confianza (se le adelanta)
  nivel         text not null default 'sin_verificar'
                check (nivel in ('sin_verificar','en_revision','verificado','confianza','rechazado')),
  motivo_rechazo text,
  -- Cuánto se le puede adelantar. 0 = nada. Lo pone una persona, nunca la app.
  credito_usd   numeric(12,2) not null default 0 check (credito_usd >= 0),
  credito_por   text,
  credito_en    timestamptz,
  revisado_por  text,
  revisado_en   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;

-- El cliente ve y edita lo suyo, pero NO su nivel ni su crédito: esos los
-- mueve el administrador. Las columnas sensibles se protegen abajo.
drop policy if exists cp_propio_select on public.customer_profiles;
create policy cp_propio_select on public.customer_profiles
  for select to authenticated using (id = auth.uid() or public.es_admin());

drop policy if exists cp_propio_insert on public.customer_profiles;
create policy cp_propio_insert on public.customer_profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists cp_propio_update on public.customer_profiles;
create policy cp_propio_update on public.customer_profiles
  for update to authenticated
  using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

-- Que nadie se suba el nivel ni se ponga crédito a sí mismo.
create or replace function public.solo_admin_mueve_el_nivel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.es_admin() then return new; end if;
  if new.nivel is distinct from old.nivel
     or new.credito_usd is distinct from old.credito_usd
     or new.credito_por is distinct from old.credito_por then
    raise exception 'El nivel de verificación y el crédito los decide el administrador.'
      using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists nivel_solo_admin on public.customer_profiles;
create trigger nivel_solo_admin
  before update on public.customer_profiles
  for each row execute function public.solo_admin_mueve_el_nivel();

-- ── El familiar que recibe en Cuba ──────────────────────────────────────────
create table if not exists public.customer_beneficiaries (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customer_profiles(id) on delete cascade,
  full_name    text not null,
  phone        text,
  provincia    text not null default 'La Habana',
  municipio    text,
  zona         text,
  direccion    text,
  referencia   text,
  created_at   timestamptz not null default now()
);
alter table public.customer_beneficiaries enable row level security;

drop policy if exists cb_propio on public.customer_beneficiaries;
create policy cb_propio on public.customer_beneficiaries
  for all to authenticated
  using (customer_id = auth.uid() or public.es_admin())
  with check (customer_id = auth.uid());

-- ── Los documentos ──────────────────────────────────────────────────────────
-- Aquí solo vive la FICHA del documento. El archivo está en un bucket privado.
create table if not exists public.customer_documents (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  tipo        text not null check (tipo in ('carnet_frente','carnet_reverso')),
  ruta        text not null unique,
  subido_en   timestamptz not null default now(),
  unique (customer_id, tipo)
);
alter table public.customer_documents enable row level security;

-- El cliente sube y ve los suyos. Leerlos todos, solo el administrador.
drop policy if exists cd_propio on public.customer_documents;
create policy cd_propio on public.customer_documents
  for all to authenticated
  using (customer_id = auth.uid() or public.es_admin())
  with check (customer_id = auth.uid());

-- ── Quién miró qué ──────────────────────────────────────────────────────────
-- Misma idea que la bitácora de los números de tarjeta en Cuadre: un carnet
-- identifica a una persona real y no se puede cambiar como una contraseña, así
-- que cada vez que alguien lo abre queda escrito.
create table if not exists public.document_views (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.customer_documents(id) on delete cascade,
  visto_por   text not null,
  visto_en    timestamptz not null default now()
);
alter table public.document_views enable row level security;

drop policy if exists dv_solo_admin on public.document_views;
create policy dv_solo_admin on public.document_views
  for select to authenticated using (public.es_admin());

comment on table public.customer_profiles is
  'Cliente de la web. El nivel y el crédito los mueve solo un administrador (ver trigger nivel_solo_admin): «confianza» significa que se le adelanta la entrega en Cuba antes de que pague.';
comment on table public.document_views is
  'Bitácora: quién abrió el carnet de quién y cuándo. Se escribe ANTES de entregar el archivo.';
