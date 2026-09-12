-- Quien recibe el pedido en Cuba.
--
-- Hasta ahora `store_orders` solo guardaba a quien paga, que está en Guyana.
-- Con eso no se puede entregar nada: quien recibe es su familiar en Cuba, es
-- otra persona, y sus datos no estaban en ningún sitio.
--
-- Todo nulable a propósito: los pedidos que ya existen no tienen destino y no
-- hay de dónde sacárselo.
--
-- Aplicada al proyecto real (dkiiknsfbefpkrnmbzid) vía MCP. Este archivo es el
-- registro versionado en el repositorio.
alter table public.store_orders
  add column if not exists recipient_name         text,
  add column if not exists recipient_phone        text,
  add column if not exists recipient_municipality text,
  add column if not exists recipient_zone         text,
  add column if not exists recipient_address      text,
  add column if not exists recipient_reference    text,
  -- La mensajería se recalcula EN EL SERVIDOR contra la tabla de tarifas, igual
  -- que los precios: nunca se guarda lo que diga el navegador.
  add column if not exists shipping_cup           numeric(12,2),
  -- 'zona' = tarifa conocida · 'a-coordinar' = no se reconoció el barrio, y
  -- entonces no se cobra un número inventado.
  add column if not exists shipping_status        text,
  -- Con qué tabla de tarifas se cerró, para poder mirar atrás cuando cambien.
  add column if not exists shipping_rate_version  text;

alter table public.store_orders
  drop constraint if exists store_orders_shipping_status_check;
alter table public.store_orders
  add constraint store_orders_shipping_status_check
  check (shipping_status is null or shipping_status in ('zona','a-coordinar'));

comment on column public.store_orders.recipient_name is
  'Quien recibe en Cuba. No es quien paga: ese está en Guyana (customer_name).';
comment on column public.store_orders.shipping_cup is
  'Mensajería en CUP, calculada en el servidor. NULL cuando queda a coordinar.';
