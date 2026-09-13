-- Mandar los documentos no es ascenderse.
--
-- El trigger bloqueaba TODO cambio de nivel que no hiciera un administrador, y
-- eso incluía el único que el cliente tiene que poder hacer: decir «ya los
-- mandé, míralos». Sin esto, o se le abría la puerta entera —y entonces
-- cualquiera se pone «de confianza» y pide que le adelanten dinero— o la
-- pantalla de verificar no podía funcionar.
--
-- Se abre exactamente ese paso y ninguno más: de sin verificar (o rechazado,
-- que vuelve a intentarlo) a «en revisión». Verificado, confianza y el crédito
-- siguen siendo cosa de una persona.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP y comprobada
-- haciéndose pasar por un cliente, dentro de una transacción que se deshace:
-- puede pasar a «en revisión» y cambiar su nombre; NO puede ponerse verificado,
-- ni de confianza, ni darse crédito.
create or replace function public.solo_admin_mueve_el_nivel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.es_admin() then return new; end if;

  if new.nivel is distinct from old.nivel then
    if not (old.nivel in ('sin_verificar', 'rechazado') and new.nivel = 'en_revision') then
      raise exception 'El nivel de verificación lo decide el administrador.'
        using errcode = '42501';
    end if;
    -- Al reenviar, el motivo del rechazo anterior deja de tener sentido.
    new.motivo_rechazo := null;
  end if;

  if new.credito_usd is distinct from old.credito_usd
     or new.credito_por is distinct from old.credito_por then
    raise exception 'El crédito lo decide el administrador.'
      using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end $$;

comment on function public.solo_admin_mueve_el_nivel() is
  'El cliente solo puede pasar a «en revisión» (mandar sus papeles). Verificado, confianza y el crédito los pone un administrador.';
