update public.market_products
set public_image_url = '/catalog/alimentos/combo-kiosko/hero.webp',
    image_status = 'published',
    updated_at = now()
where slug = 'combo-kiosko';

update public.market_public_catalog
set image_url = '/catalog/alimentos/combo-kiosko/hero.webp',
    updated_at = now()
where slug = 'combo-kiosko';
