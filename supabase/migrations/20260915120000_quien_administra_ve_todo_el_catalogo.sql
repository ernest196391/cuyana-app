-- La puerta de una sola dirección.
--
-- `market_public_catalog` tenía una única política de lectura, la del público:
--     USING (available AND (valid_until is null or valid_until > now()))
--
-- Parece inofensiva hasta que se junta con una regla de Postgres: cuando un
-- UPDATE lleva WHERE, hace falta PODER LEER la fila para encontrarla. O sea
-- que en cuanto a un producto se le vencía el precio, se volvía invisible —y
-- por tanto intocable— para el propio código que tenía que renovarlo.
--
-- Resultado: el 15 de septiembre venció todo el catálogo, se pulsó «Renovar
-- todo», las 34 ofertas se revisaron de verdad contra sus proveedores, cuatro
-- combos renovaron bien... y la tienda siguió apagada. La actualización de la
-- ficha tocaba CERO filas y no daba error. Un `update` que no actualiza nada
-- y contesta «ok» es de los fallos más caros que hay: todo parece funcionar.
--
-- `market_supplier_offers` no lo sufría porque su política es FOR ALL, que
-- incluye la lectura. Esa es exactamente la diferencia entre las dos tablas.

create policy market_public_catalog_admin_lee_todo
  on public.market_public_catalog
  for select
  to authenticated
  using (public.es_admin());

-- Y de paso, el correo a fuego.
--
-- Estas políticas comparaban contra 'ernest196391@gmail.com' escrito dentro.
-- Eso significa que dar de alta a otra persona que administre exige una
-- migración, y que el día que ese correo cambie se queda todo el mundo fuera.
-- El resto del sistema ya usa `es_admin()`, que mira la tabla `app_admins`:
-- alta de un administrador = una fila, no un despliegue. Estas tres tablas se
-- habían quedado atrás.

drop policy if exists market_public_catalog_admin_update on public.market_public_catalog;
create policy market_public_catalog_admin_update
  on public.market_public_catalog for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists market_public_catalog_admin_insert on public.market_public_catalog;
create policy market_public_catalog_admin_insert
  on public.market_public_catalog for insert to authenticated
  with check (public.es_admin());

drop policy if exists market_public_catalog_admin_delete on public.market_public_catalog;
create policy market_public_catalog_admin_delete
  on public.market_public_catalog for delete to authenticated
  using (public.es_admin());

drop policy if exists market_products_solo_admin on public.market_products;
create policy market_products_solo_admin
  on public.market_products for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists market_supplier_offers_solo_admin on public.market_supplier_offers;
create policy market_supplier_offers_solo_admin
  on public.market_supplier_offers for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
