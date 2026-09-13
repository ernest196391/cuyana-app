-- LA CUENTA DEL CLIENTE, POR DEBAJO
--
-- Para que «Mi cuenta» pueda enseñar el historial hace falta que un pedido
-- sepa de quién es. Hasta ahora no lo sabía: entraban todos como anónimos.
--
-- Sigue siendo opcional a propósito. Quien pide por WhatsApp sin cuenta tiene
-- que poder seguir pidiendo: el día que esto sea obligatorio se pierden
-- clientes, no se ganan.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP como
-- `20260913...._el_pedido_sabe_de_quien_es`. Comprobada haciéndose pasar por
-- dos clientes y por el administrador, dentro de una transacción que se
-- deshace: cada cliente ve solo lo suyo, puede pedir con su cuenta, NO puede
-- firmar un pedido a nombre de otro, el anónimo sigue pudiendo pedir y un
-- cliente cualquiera no pasa por administrador.

-- ── 1. De quién es cada pedido ──────────────────────────────────────────────
alter table public.orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null;
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);

alter table public.store_orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null;
create index if not exists store_orders_customer_idx on public.store_orders (customer_id, created_at desc);

-- ── 2. Quien entra con su cuenta TIENE que poder pedir ──────────────────────
-- `orders_public_insert` estaba dada solo al rol `anon`. En cuanto un cliente
-- inicia sesión deja de ser anon y su pedido lo rechazaba la base: la pantalla
-- diría «no se pudo registrar» justo a la persona que se molestó en crear una
-- cuenta. Se reemplaza por una que cubre a los dos.
drop policy if exists orders_public_insert on public.orders;
create policy orders_insert_cualquiera on public.orders
  for insert to anon, authenticated
  with check (
    amount_gyd > 0 and amount_cup > 0
    -- Y nadie puede firmar un pedido a nombre de otro: o va sin dueño, o va
    -- con el suyo. Para `anon`, auth.uid() es nulo, así que solo puede el
    -- primero.
    and (customer_id is null or customer_id = auth.uid())
  );

drop policy if exists store_orders_public_insert on public.store_orders;
create policy store_orders_insert_cualquiera on public.store_orders
  for insert to anon, authenticated
  with check (customer_id is null or customer_id = auth.uid());

-- ── 3. Cada quien ve lo suyo ────────────────────────────────────────────────
drop policy if exists orders_admin_select on public.orders;
create policy orders_select_propio_o_admin on public.orders
  for select to authenticated
  using (customer_id = auth.uid() or public.es_admin());

drop policy if exists store_orders_admin_select on public.store_orders;
create policy store_orders_select_propio_o_admin on public.store_orders
  for select to authenticated
  using (customer_id = auth.uid() or public.es_admin());

-- ── 4. Ser administrador vuelve a ser una fila, no una migración ────────────
-- Las políticas llevaban el correo escrito dentro. Dar de alta a Adonys como
-- administrador obligaría a tocar seis políticas y desplegar. Con es_admin()
-- es un insert en app_admins, que es lo que se decidió al crear esa tabla.
drop policy if exists orders_admin_update on public.orders;
create policy orders_update_admin on public.orders
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists store_orders_admin_update on public.store_orders;
create policy store_orders_update_admin on public.store_orders
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists referrals_admin_select on public.referrals;
create policy referrals_select_admin on public.referrals
  for select to authenticated using (public.es_admin());

drop policy if exists referrals_admin_insert on public.referrals;
create policy referrals_insert_admin on public.referrals
  for insert to authenticated with check (public.es_admin());

drop policy if exists referrals_admin_update on public.referrals;
create policy referrals_update_admin on public.referrals
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists delivery_methods_solo_admin_insert on public.delivery_methods;
create policy delivery_methods_insert_admin on public.delivery_methods
  for insert to authenticated with check (public.es_admin());

drop policy if exists delivery_methods_solo_admin_update on public.delivery_methods;
create policy delivery_methods_update_admin on public.delivery_methods
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists app_config_solo_admin_write on public.app_config;
create policy app_config_insert_admin on public.app_config
  for insert to authenticated with check (public.es_admin());

drop policy if exists app_config_solo_admin_update on public.app_config;
create policy app_config_update_admin on public.app_config
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

comment on column public.orders.customer_id is
  'Quién lo pidió, si lo pidió con su cuenta. Nulo cuando entró por WhatsApp sin cuenta: pedir sin registrarse tiene que seguir funcionando.';
