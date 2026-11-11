-- ============================================================================
-- CAFÉOS DATABASE ARCHITECTURE - MIGRATION 10: INDIAN CUISINE & INR LOCALIZATION
-- ============================================================================

-- 1. Update Default Demo Restaurant to Indian Cuisine & INR
UPDATE public.restaurants
SET
  name = 'Zaika Heritage – Royal Indian Kitchen & Chai Bar',
  tagline = 'Authentic Indian Flavours, Dum Biryanis & Handcrafted Chai',
  description = 'An acclaimed Indian dining experience celebrating regal Awadhi & Hyderabadi Dum Biryanis, charcoal-smoked clay oven tandoori kebabs, slow-simmered rich curries, and artisanal kulhad chai.',
  cuisine = 'Royal Indian, Mughlai & Tandoor',
  currency = 'INR',
  currency_symbol = '₹',
  tax_percentage = 5.00,
  address = 'Plot 42, 100 Feet Road, Indiranagar, HAL 2nd Stage',
  city = 'Bengaluru, Karnataka 560038',
  contact_email = 'namaste@zaikaheritage.in',
  contact_phone = '+91 98450 23419',
  opening_hours = 'Mon - Sun: 8:00 AM - 11:30 PM',
  logo_url = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80',
  banner_url = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222201';

-- 2. Upsert Indian Food Categories using unique constraint (restaurant_id, slug)
INSERT INTO public.categories (restaurant_id, name, slug, icon, sort_order)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Dum Biryanis', 'biryani', '🍚', 1),
  ('22222222-2222-2222-2222-222222222201', 'Royal Curries & Gravies', 'curries', '🍲', 2),
  ('22222222-2222-2222-2222-222222222201', 'Tandoor & Starters', 'tandoor', '🍢', 3),
  ('22222222-2222-2222-2222-222222222201', 'Chaat & Street Eats', 'street', '🥟', 4),
  ('22222222-2222-2222-2222-222222222201', 'Naan & Roti', 'breads', '🫓', 5),
  ('22222222-2222-2222-2222-222222222201', 'Mithai & Sweets', 'desserts', '🍨', 6),
  ('22222222-2222-2222-2222-222222222201', 'Chai & Cold Lassi', 'chai', '☕', 7)
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 3. Upsert Authentic Indian Products
INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Hyderabadi Chicken Dum Biryani',
  'hyderabadi-chicken-dum-biryani',
  'Aged long-grain Daawat basmati rice dum-cooked with tender chicken steeped in saffron, browned onions, whole spices, and mint. Served with Mirchi Ka Salan and Burani Raita.',
  380.00,
  420.00,
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  false,
  true,
  true,
  4.9,
  3840,
  18,
  680,
  1
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'biryani'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Awadhi Dum Mutton Biryani',
  'awadhi-dum-mutton-biryani',
  'Slow-cooked succulent goat pieces dum-pukht in a sealed earthen handi with fragrant rose water, mace, cardamom, and royal saffron basmati rice.',
  460.00,
  510.00,
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
  false,
  true,
  true,
  4.9,
  2950,
  20,
  790,
  2
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'biryani'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Old Delhi Butter Chicken (Murgh Makhani)',
  'old-delhi-butter-chicken',
  'Tender tandoor-roasted chicken simmered in a silky tomato, cashew nut, and churned Makhan gravy infused with dried kasuri methi.',
  390.00,
  440.00,
  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  false,
  true,
  true,
  4.9,
  4210,
  15,
  640,
  3
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'curries'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Paneer Butter Masala',
  'paneer-butter-masala',
  'Fresh artisanal cottage cheese cubes tossed in a rich, buttery sun-ripened tomato gravy topped with fresh ginger juliennes and clotted cream.',
  330.00,
  370.00,
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  true,
  true,
  true,
  4.9,
  3670,
  12,
  520,
  4
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'curries'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Dal Makhani Bukhara',
  'dal-makhani-bukhara',
  'Black urad lentils and kidney beans simmered for 24 hours over slow charcoal embers with dairy cream, garlic, and pure churned butter.',
  270.00,
  300.00,
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  true,
  true,
  true,
  4.9,
  3190,
  10,
  420,
  5
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'curries'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Murgh Tikka Angara',
  'murgh-tikka-angara',
  'Smoky, fiery boneless chicken thighs marinated in Kashmiri red chilies, mustard oil, and hung curd, charred to perfection in traditional clay tandoor.',
  350.00,
  390.00,
  'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
  false,
  true,
  true,
  4.8,
  2840,
  16,
  480,
  6
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'tandoor'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Dilli 6 Samosa Chaat with Dahi & Chutneys',
  'dilli-6-samosa-chaat',
  'Two golden flaky potato samosas crushed and smothered with warm spiced chana curry, chilled sweetened yoghurt, tangy tamarind, and spicy mint chutney.',
  130.00,
  150.00,
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  true,
  true,
  true,
  4.8,
  3210,
  5,
  360,
  7
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'street'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Crispy Butter Garlic Naan',
  'crispy-butter-garlic-naan',
  'Hand-stretched leavened tandoori bread topped with minced roasted garlic, fresh coriander, and melted Amul butter.',
  65.00,
  75.00,
  'https://images.unsplash.com/photo-1601050690187-573e87707328?auto=format&fit=crop&w=600&q=80',
  true,
  true,
  true,
  4.9,
  4890,
  3,
  220,
  8
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'breads'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Royal Kulhad Masala Chai',
  'royal-kulhad-masala-chai',
  'Assam CTC black tea slow-brewed with fresh hand-pounded ginger, green cardamom, cloves, and whole milk, poured piping hot into clay earthen kulhads.',
  50.00,
  null,
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  true,
  true,
  true,
  4.9,
  5120,
  4,
  120,
  9
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'chai'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();

INSERT INTO public.products (restaurant_id, category_id, name, slug, description, price, original_price, image_url, is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories, sort_order)
SELECT
  '22222222-2222-2222-2222-222222222201',
  c.id,
  'Ratnagiri Alphonso Mango Lassi',
  'ratnagiri-alphonso-mango-lassi',
  'Thick hand-churned sweet yoghurt blended with real Ratnagiri Alphonso mango pulp, green cardamom, and toasted Iranian pistachio slivers.',
  110.00,
  null,
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80',
  true,
  true,
  true,
  4.9,
  3420,
  3,
  240,
  10
FROM public.categories c
WHERE c.restaurant_id = '22222222-2222-2222-2222-222222222201' AND c.slug = 'chai'
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url,
  is_veg = EXCLUDED.is_veg,
  updated_at = now();
