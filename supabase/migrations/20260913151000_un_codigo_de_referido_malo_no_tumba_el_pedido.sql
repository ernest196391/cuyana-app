-- Un código de referido que no existe NO puede costarle el pedido a nadie.
--
-- `orders.ref_code` apunta con clave foránea a `referrals.code`. La web mete
-- ahí, tal cual, lo que venga en `?ref=` de la dirección. Basta con que alguien
-- comparta el enlace mal copiado, o que el promotor se dé de baja, para que el
-- insert entero reviente: el cliente ve «no se pudo registrar» y el pedido se
-- pierde. Comprobado contra la base: un código inventado devuelve
-- foreign_key_violation, y el catch de la web solo lo escribe en la consola.
--
-- Lo que se pierde con esto es a quién atribuir el referido, que es una
-- comisión. Lo que se salva es el pedido, que es el negocio. No hay duda de
-- cuál de los dos importa más.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP y comprobada como
-- `anon`, que es quien inserta de verdad: el pedido se guarda y el código malo
-- queda en nulo.
create or replace function public.referido_que_no_existe_se_ignora()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ref_code is not null
     and not exists (select 1 from public.referrals r where r.code = new.ref_code) then
    -- A los registros, para que se pueda ver si alguien está repartiendo un
    -- enlace roto en vez de que desaparezca sin más.
    raise warning 'Pedido con código de referido desconocido (%): se guarda sin él.', new.ref_code;
    new.ref_code := null;
  end if;
  return new;
end $$;

drop trigger if exists referido_desconocido on public.orders;
create trigger referido_desconocido
  before insert or update of ref_code on public.orders
  for each row execute function public.referido_que_no_existe_se_ignora();

comment on function public.referido_que_no_existe_se_ignora() is
  'Vacía un ref_code que no exista, en vez de dejar que la clave foránea tumbe el pedido. Se pierde el referido; no se pierde el pedido.';
