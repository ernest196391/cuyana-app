-- Las fichas con valid_until nulo se consideran vencidas por diseño. Estos
-- precios fueron confirmados el 20/09/2026 y deben renovarse junto con la tasa.
update public.market_public_catalog
set
  valid_until = now() + interval '7 days',
  source_checked_at = now(),
  available = true,
  updated_at = now()
where slug in (
  'cafetera-eko-eko401m-01',
  'aire-acondicionado-split-2-toneladas',
  'ventilador-recargable-f38',
  'luminaria-solar-calle-800w',
  'ventilador-recargable-yj-2219'
);
