-- El comprobante que le enseña a su familia.
--
-- Quien tiene la referencia puede ver el envío sin entrar con cuenta: la
-- familia en Cuba no tiene por qué registrarse para comprobar que el dinero
-- viene en camino, y esa referencia es un UUID que solo tiene quien lo mandó.
--
-- Por eso sale lo justo: cuánto, en qué método y cuándo. NO sale quién lo
-- mandó, ni su teléfono, ni su correo, ni el código de referido, ni nada de
-- Cuadre. Un comprobante que se pasa por WhatsApp acaba en manos que no
-- eligió nadie, y lo que no sale no se puede filtrar.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP.
create or replace function public.comprobante(ref uuid)
returns table (
  amount_gyd  numeric,
  amount_cup  numeric,
  method_key  text,
  creado      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.amount_gyd, o.amount_cup, o.method_key, o.created_at
    from public.orders o
   where o.tracking_ref = ref
   limit 1;
$$;

revoke all on function public.comprobante(uuid) from public;
grant execute on function public.comprobante(uuid) to anon, authenticated;

comment on function public.comprobante(uuid) is
  'El envío visto por quien tiene su referencia: cuánto, por qué método y cuándo. Sin nombres ni teléfonos: esto se comparte por WhatsApp.';
