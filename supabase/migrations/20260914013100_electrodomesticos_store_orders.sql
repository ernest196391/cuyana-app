-- CUYANA-ELECTRO-001: la nueva categoría debe poder persistir pedidos reales.
alter table public.store_orders
  drop constraint if exists store_orders_category_check;
alter table public.store_orders
  add constraint store_orders_category_check
  check (category in ('alimentos', 'energia', 'electrodomesticos'));
