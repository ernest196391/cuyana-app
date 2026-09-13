-- El perfil se crea con la cuenta, no después.
--
-- Si lo insertara la web justo después del registro, bastaría con que se
-- cayera la red en ese segundo para dejar una cuenta sin perfil: la persona
-- entra, no tiene nivel, no tiene nombre, y no hay pantalla que lo arregle.
-- Aquí no puede pasar: o existen las dos filas o no existe ninguna.
--
-- El nombre y el teléfono llegan en `raw_user_meta_data` porque el alta los
-- manda con `options.data`. Aplicada al proyecto real (dkiiknsfbefpkrnmbzid)
-- vía MCP.
create or replace function public.crear_perfil_de_cliente()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.customer_profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists perfil_al_registrarse on auth.users;
create trigger perfil_al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil_de_cliente();

-- Las cuentas que ya existen se quedarían sin perfil. Se les pone ahora.
insert into public.customer_profiles (id)
select u.id from auth.users u
 where not exists (select 1 from public.customer_profiles p where p.id = u.id);

comment on function public.crear_perfil_de_cliente() is
  'Crea el perfil junto con la cuenta. Hacerlo desde la web dejaría cuentas sin perfil en cuanto fallara una petición.';
