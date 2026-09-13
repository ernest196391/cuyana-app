begin;

-- The researched row has no catalog photo. `brief_ready` is not publication approval.
update public.market_products
set purchasable = false,
    updated_at = now()
where slug = 'combo-kiosko';

update public.market_public_catalog
set available = false,
    valid_until = null,
    updated_at = now()
where slug = 'combo-kiosko';

commit;
