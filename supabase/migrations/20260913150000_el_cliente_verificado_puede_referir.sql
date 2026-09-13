-- Referidos del cliente verificado.
--
-- La tabla `referrals` ya existía para los promotores que da de alta el
-- administrador. Ahora un código puede pertenecer además a un cliente, que se
-- lo saca él solo desde su cuenta.
--
-- Lo que esto NO hace, a propósito: no decide cuánto se le da. `commission_pct`
-- nace en 0 y lo pone una persona en el panel, porque cuánto regalar por cada
-- amigo traído es una decisión de negocio con dinero real detrás, y ese número
-- no se inventa aquí.
--
-- Solo los verificados. Un código de referido que pueda sacarse cualquiera que
-- escriba un correo es una invitación a fabricarse cuentas para cobrarse a sí
-- mismo.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP. Comprobada dentro
-- de una transacción que se deshace: pedirlo dos veces da el mismo código, el
-- código sale del nombre sin acentos ni eñes, nace con 0%, cuenta solo los
-- pedidos que entraron con él, y alguien sin verificar ni lo saca ni ve los
-- referidos de nadie ni lee la lista de códigos.
alter table public.referrals
  add column if not exists customer_id uuid references auth.users(id) on delete set null;
create unique index if not exists referrals_customer_unico
  on public.referrals (customer_id) where customer_id is not null;

-- El cliente lee SU código y nada más. La lista entera sigue siendo del admin.
drop policy if exists referrals_select_propio on public.referrals;
create policy referrals_select_propio on public.referrals
  for select to authenticated
  using (customer_id = auth.uid() or public.es_admin());

-- Devuelve el código del cliente, creándolo la primera vez. Va como función y
-- no como un insert desde la web porque el código tiene que ser único y
-- legible, y porque hay que comprobar que quien lo pide está verificado. Es
-- idempotente: llamarla dos veces devuelve el mismo código.
create or replace function public.mi_codigo_de_referido()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yo        uuid := auth.uid();
  perfil    public.customer_profiles;
  existente text;
  base      text;
  candidato text;
  intento   int := 0;
begin
  if yo is null then
    raise exception 'Hace falta entrar con tu cuenta.' using errcode = '42501';
  end if;

  select code into existente from public.referrals where customer_id = yo;
  if existente is not null then return existente; end if;

  select * into perfil from public.customer_profiles where id = yo;
  if perfil.nivel not in ('verificado', 'confianza') then
    raise exception 'Verifica tu cuenta para poder referir.' using errcode = '42501';
  end if;

  -- Las cuatro primeras letras de su nombre, sin acentos ni espacios, y dos
  -- dígitos. Legible al dictarlo por teléfono, que es como se va a compartir.
  base := upper(substring(regexp_replace(
            translate(coalesce(perfil.full_name, 'CUYANA'),
                      'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouAEIOUnNuU'),
            '[^A-Za-z]', '', 'g') from 1 for 4));
  if length(base) < 3 then base := 'CUYA'; end if;

  loop
    intento := intento + 1;
    candidato := base || lpad((floor(random() * 100))::int::text, 2, '0');
    begin
      insert into public.referrals (code, owner_name, commission_pct, active, customer_id)
      values (candidato, coalesce(perfil.full_name, 'Cliente'), 0, true, yo);
      return candidato;
    exception when unique_violation then
      if intento >= 20 then
        raise exception 'No se pudo crear tu código. Inténtalo otra vez.';
      end if;
    end;
  end loop;
end $$;

revoke all on function public.mi_codigo_de_referido() from public;
grant execute on function public.mi_codigo_de_referido() to authenticated;

-- Cuántos han pedido con su código. Solo el número: quiénes son y cuánto
-- mandaron son pedidos de otras personas, y saber que su primo mandó 80.000
-- GYD no es asunto suyo por haberle pasado un enlace.
create or replace function public.mis_referidos()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
    from public.orders o
   where o.ref_code is not null
     and o.ref_code in (select r.code from public.referrals r where r.customer_id = auth.uid());
$$;

revoke all on function public.mis_referidos() from public;
grant execute on function public.mis_referidos() to authenticated;

comment on column public.referrals.customer_id is
  'Si el código es de un cliente de la web. Nulo en los códigos de promotores que da de alta el administrador.';
comment on function public.mi_codigo_de_referido() is
  'El código del cliente, creado la primera vez que lo pide. Solo para verificados: si no, cualquiera se fabrica cuentas para cobrarse a sí mismo.';
