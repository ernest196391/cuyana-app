-- La provincia ya no puede estar implícita: CUYANA entrega inventario local
-- tanto en La Habana como en Santiago de Cuba.
alter table public.store_orders
  add column if not exists recipient_province text;

update public.store_orders
set recipient_province = 'La Habana'
where recipient_province is null
  and recipient_municipality is not null;
