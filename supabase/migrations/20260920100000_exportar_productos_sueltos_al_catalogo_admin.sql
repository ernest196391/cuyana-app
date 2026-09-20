-- A petición del negocio: todo lo que ya está en el catálogo (productos
-- sueltos, no combos) pasa a administrarse desde /admin/catalogo, igual que
-- en Zaldívar — un solo lugar, sin depender de revalidar cada 24h contra
-- Revolico. Los combos (kind='bundle': Combo Kiosko y los 4 combos de
-- alimentos) NO se tocan aquí: tienen composición y política de sustitución
-- que el formulario simple de /admin/catalogo todavía no edita, así que
-- seguirían gestionándose bien pero "a ciegas" desde ahí. Quedan en
-- Abastecer hasta que se decida construirles su propio editor.

begin;

update public.market_products
set source = 'admin', admin_status = 'publicado', updated_at = now()
where kind = 'product' and source = 'market';

update public.market_public_catalog c
set valid_until = now() + interval '10 years', updated_at = now()
from public.market_products mp
where mp.id = c.product_id and mp.source = 'admin' and mp.kind = 'product';

commit;
