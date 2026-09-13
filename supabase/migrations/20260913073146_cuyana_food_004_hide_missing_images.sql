begin;

-- CUYANA-FOOD-004: no product without an approved image may remain purchasable.
update public.market_products
set purchasable = false,
    updated_at = now()
where slug = 'combo-kiosko'
  and image_status = 'needed';

update public.market_public_catalog c
set available = false,
    valid_until = null,
    updated_at = now()
from public.market_products p
where p.slug = c.slug
  and p.slug = 'combo-kiosko'
  and p.image_status = 'needed';

commit;
