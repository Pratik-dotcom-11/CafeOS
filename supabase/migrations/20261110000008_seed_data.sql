-- 20261110000008_seed_data.sql
-- Seed subscription plans (₹ INR), demo restaurant "Zaika Heritage", categories, products, addons, tables, and settings

-- 1. Subscription Plans (Indian SaaS Pricing in ₹ INR)
INSERT INTO public.subscription_plans (id, name, slug, description, price_monthly, price_yearly, max_terminals, max_orders_per_month, has_kds, has_inventory, has_analytics, has_loyalty, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Starter Tier', 'starter', 'Ideal for independent chai kiosks, sweet stalls, and cloud kitchens.', 2499.00, 24990.00, 1, 500, false, false, true, false, true),
  ('11111111-1111-1111-1111-111111111102', 'Growth Tier', 'growth', 'Complete restaurant operations with real-time Kitchen Display System (KDS).', 5999.00, 59990.00, 3, 5000, true, true, true, false, true),
  ('11111111-1111-1111-1111-111111111103', 'Professional Tier', 'professional', 'Multi-station restaurant with full analytics, automated recipe inventory, and CRM.', 11999.00, 119990.00, 10, 50000, true, true, true, true, true),
  ('11111111-1111-1111-1111-111111111104', 'Enterprise Tier', 'enterprise', 'Multi-city fine-dining restaurant chains with enterprise SLA and custom API access.', 24999.00, 249990.00, 999, 999999, true, true, true, true, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly;

-- 2. Demo Restaurant: Zaika Heritage – Royal Indian Kitchen & Chai Bar
INSERT INTO public.restaurants (
  id, name, slug, tagline, description, logo_url, banner_url, cuisine, rating,
  address, city, contact_email, contact_phone, opening_hours, currency, currency_symbol, tax_percentage,
  delivery_available, takeaway_available, is_active
)
VALUES (
  '22222222-2222-2222-2222-222222222201',
  'Zaika Heritage – Royal Indian Kitchen & Chai Bar',
  'artisan-brew',
  'Authentic Indian Flavours, Dum Biryanis & Handcrafted Chai',
  'An acclaimed Indian dining experience celebrating regal Awadhi & Hyderabadi Dum Biryanis, charcoal-smoked clay oven tandoori kebabs, slow-simmered rich curries, and artisanal kulhad chai.',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'Royal Indian, Mughlai & Tandoor',
  4.9,
  'Plot 42, 100 Feet Road, Indiranagar, HAL 2nd Stage',
  'Bengaluru, Karnataka 560038',
  'namaste@zaikaheritage.in',
  '+91 98450 23419',
  'Mon - Sun: 8:00 AM - 11:30 PM',
  'INR',
  '₹',
  5.0,
  true,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  cuisine = EXCLUDED.cuisine,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  currency = EXCLUDED.currency,
  currency_symbol = EXCLUDED.currency_symbol,
  tax_percentage = EXCLUDED.tax_percentage;

-- 3. Restaurant Subscription
INSERT INTO public.subscriptions (
  id, restaurant_id, plan_id, status, current_period_start, current_period_end
)
VALUES (
  '33333333-3333-3333-3333-333333333301',
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111103',
  'active'::public.subscription_status,
  now(),
  now() + interval '365 days'
)
ON CONFLICT (restaurant_id) DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status;

-- 4. Restaurant Settings
INSERT INTO public.restaurant_settings (
  restaurant_id, kds_chime_enabled, auto_accept_orders, sound_volume, receipt_header, receipt_footer, tax_id_number
)
VALUES (
  '22222222-2222-2222-2222-222222222201',
  true,
  false,
  85,
  'Zaika Heritage – Indiranagar, Bengaluru',
  'Dhanyawaad for dining with us! Swagat Hamesha.',
  '29AABCT1332L1Z4'
)
ON CONFLICT (restaurant_id) DO UPDATE SET
  receipt_header = EXCLUDED.receipt_header,
  receipt_footer = EXCLUDED.receipt_footer,
  tax_id_number = EXCLUDED.tax_id_number;

-- 5. Categories
INSERT INTO public.categories (id, restaurant_id, name, slug, icon, sort_order)
VALUES
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', 'Dum Biryanis', 'biryani', '🍚', 1),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222201', 'Royal Curries', 'curries', '🍲', 2),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201', 'Tandoor & Starters', 'tandoor', '🍢', 3),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222201', 'Chaat & Street Eats', 'street', '🥟', 4),
  ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222201', 'Naan & Roti', 'breads', '🫓', 5),
  ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222201', 'Mithai & Sweets', 'desserts', '🍨', 6),
  ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222201', 'Chai & Cold Lassi', 'chai', '☕', 7)
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon;

-- 6. Products (Authentic Indian Cuisine in ₹ INR)
INSERT INTO public.products (
  id, restaurant_id, category_id, name, slug, description, price, original_price, image_url,
  is_veg, is_available, is_bestseller, rating, review_count, prep_time_minutes, calories
)
VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444401',
    'Hyderabadi Chicken Dum Biryani',
    'hyderabadi-chicken-dum-biryani',
    'Aged long-grain Daawat basmati rice dum-cooked with tender chicken steeped in saffron, browned onions, whole spices, and mint. Served with Mirchi Ka Salan and Burani Raita.',
    380.00, 420.00,
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    false, true, true, 4.9, 3840, 18, 680
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444401',
    'Awadhi Dum Mutton Biryani',
    'awadhi-dum-mutton-biryani',
    'Slow-cooked succulent goat pieces dum-pukht in a sealed earthen handi with fragrant rose water, mace, cardamom, and royal saffron basmati rice.',
    460.00, 510.00,
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
    false, true, true, 4.9, 2950, 20, 790
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444402',
    'Old Delhi Butter Chicken (Murgh Makhani)',
    'old-delhi-butter-chicken',
    'Tender tandoor-roasted chicken simmered in a silky tomato, cashew nut, and churned Makhan gravy infused with dried kasuri methi.',
    390.00, 440.00,
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
    false, true, true, 4.9, 4210, 15, 640
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444402',
    'Paneer Butter Masala (Paneer Makhani)',
    'paneer-butter-masala',
    'Fresh artisanal cottage cheese cubes tossed in a rich, buttery sun-ripened tomato gravy topped with fresh ginger juliennes and clotted cream.',
    330.00, 370.00,
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    true, true, true, 4.9, 3670, 12, 520
  ),
  (
    '55555555-5555-5555-5555-555555555505',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444402',
    'Dal Makhani Bukhara (Slow Cooked)',
    'dal-makhani-bukhara',
    'Black urad lentils and kidney beans simmered for 24 hours over slow charcoal embers with dairy cream, garlic, and pure churned butter.',
    270.00, 300.00,
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    true, true, true, 4.9, 3190, 10, 420
  ),
  (
    '55555555-5555-5555-5555-555555555506',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444403',
    'Murgh Tikka Angara (Tandoori Kebabs)',
    'murgh-tikka-angara',
    'Smoky, fiery boneless chicken thighs marinated in Kashmiri red chilies, mustard oil, and hung curd, charred to perfection in traditional clay tandoor.',
    350.00, 390.00,
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    false, true, true, 4.8, 2840, 16, 480
  ),
  (
    '55555555-5555-5555-5555-555555555507',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444404',
    'Dilli 6 Samosa Chaat with Dahi & Chutneys',
    'dilli-6-samosa-chaat',
    'Two golden flaky potato samosas crushed and smothered with warm spiced chana curry, chilled sweetened yoghurt, tangy tamarind, and spicy mint chutney.',
    130.00, 150.00,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    true, true, true, 4.8, 3210, 5, 360
  ),
  (
    '55555555-5555-5555-5555-555555555508',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444405',
    'Crispy Butter Garlic Naan',
    'crispy-butter-garlic-naan',
    'Hand-stretched refined wheat flatbread baked against the roaring terracotta wall of the clay tandoor, slathered in salted Amul butter and roasted garlic slivers.',
    65.00, NULL,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    true, true, true, 4.9, 4520, 3, 210
  ),
  (
    '55555555-5555-5555-5555-555555555509',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444407',
    'Royal Kulhad Masala Chai',
    'royal-kulhad-masala-chai',
    'Assam CTC black tea slow-brewed with fresh hand-pounded ginger, green cardamom, cloves, and whole milk, poured piping hot into clay earthen kulhads.',
    50.00, NULL,
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    true, true, true, 4.9, 5120, 4, 120
  ),
  (
    '55555555-5555-5555-5555-555555555510',
    '22222222-2222-2222-2222-222222222201',
    '44444444-4444-4444-4444-444444444407',
    'Ratnagiri Alphonso Mango Lassi',
    'ratnagiri-alphonso-mango-lassi',
    'Thick hand-churned sweet yoghurt blended with real Ratnagiri Alphonso mango pulp, green cardamom, and toasted Iranian pistachio slivers.',
    110.00, 130.00,
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80',
    true, true, true, 4.9, 3420, 3, 240
  )
ON CONFLICT (restaurant_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  image_url = EXCLUDED.image_url;

-- 7. Product Addons & Customizations
INSERT INTO public.product_addons (product_id, group_title, required, max_select, option_name, price, sort_order)
VALUES
  ('55555555-5555-5555-5555-555555555501', 'Spice Preference', true, 1, 'Mild & Aromatic', 0.00, 1),
  ('55555555-5555-5555-5555-555555555501', 'Spice Preference', true, 1, 'Royal Classic (Medium)', 0.00, 2),
  ('55555555-5555-5555-5555-555555555501', 'Spice Preference', true, 1, 'Andhra Fiery Hot', 0.00, 3),
  ('55555555-5555-5555-5555-555555555501', 'Royal Add-ons', false, 3, 'Extra Boiled Farm Egg', 25.00, 1),
  ('55555555-5555-5555-5555-555555555501', 'Royal Add-ons', false, 3, 'Extra Mirchi Ka Salan', 30.00, 2),
  ('55555555-5555-5555-5555-555555555501', 'Royal Add-ons', false, 3, 'Chicken Tikka Topping (2 pcs)', 90.00, 3),
  ('55555555-5555-5555-5555-555555555503', 'Portion & Bone Preference', true, 1, 'Classic Half (Bone-in)', 0.00, 1),
  ('55555555-5555-5555-5555-555555555503', 'Portion & Bone Preference', true, 1, '100% Boneless Chicken', 60.00, 2),
  ('55555555-5555-5555-5555-555555555503', 'Makhani Extras', false, 2, 'Extra Churned White Butter', 35.00, 1),
  ('55555555-5555-5555-5555-555555555503', 'Makhani Extras', false, 2, 'Double Malai Swirl', 30.00, 2)
ON CONFLICT DO NOTHING;

-- 8. Restaurant Tables
INSERT INTO public.restaurant_tables (restaurant_id, table_number, capacity, section, status)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Table 01', 2, 'Main Dining', 'available'),
  ('22222222-2222-2222-2222-222222222201', 'Table 02', 4, 'Main Dining', 'billing'),
  ('22222222-2222-2222-2222-222222222201', 'Table 03', 4, 'Main Dining', 'available'),
  ('22222222-2222-2222-2222-222222222201', 'Table 04', 6, 'Main Dining', 'occupied'),
  ('22222222-2222-2222-2222-222222222201', 'Table 05', 2, 'Patio Garden', 'reserved'),
  ('22222222-2222-2222-2222-222222222201', 'Table 06', 4, 'Patio Garden', 'available'),
  ('22222222-2222-2222-2222-222222222201', 'Table 07', 2, 'Mezzanine', 'occupied'),
  ('22222222-2222-2222-2222-222222222201', 'Table 08', 8, 'Mezzanine', 'available'),
  ('22222222-2222-2222-2222-222222222201', 'Table 09', 2, 'Bar Area', 'available'),
  ('22222222-2222-2222-2222-222222222201', 'Table 10', 2, 'Bar Area', 'available')
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- 9. Suppliers & Ingredients (Authentic Indian Kitchen Commodities)
INSERT INTO public.suppliers (id, restaurant_id, name, contact_name, email, phone)
VALUES
  ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'Punjab Grain & Agro Traders', 'Harbhajan Singh', 'supply@punjabagrotraders.in', '+91 98140 33419'),
  ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222201', 'Amul India Dairy Supply', 'Ramesh Patel', 'orders@amuldairyb2b.in', '+91 98250 88211'),
  ('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222201', 'Khari Baoli Spice Merchants', 'Virendra Gupta', 'spices@kharibaolimerchants.in', '+91 98110 54109')
ON CONFLICT DO NOTHING;

INSERT INTO public.ingredients (restaurant_id, supplier_id, name, category, available_stock, min_stock, unit, cost_per_unit, status)
VALUES
  ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666601', 'Daawat Traditional Basmati Rice', 'Bakery & Grains', 85.00, 30.00, 'kg', 110.00, 'in-stock'),
  ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666602', 'Amul Fresh Malai Paneer Block', 'Dairy', 14.00, 25.00, 'kg', 340.00, 'low-stock'),
  ('22222222-2222-2222-2222-222222222201', NULL, 'Fresh Country Farm Chicken', 'Produce', 60.00, 25.00, 'kg', 220.00, 'in-stock'),
  ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666602', 'Amul Salted Yellow Butter', 'Dairy', 8.00, 20.00, 'kg', 490.00, 'low-stock'),
  ('22222222-2222-2222-2222-222222222201', '66666666-6666-6666-6666-666666666603', 'Kashmir Saffron & Shahi Masala', 'Syrups & Flavors', 5.00, 4.00, 'packs', 1850.00, 'in-stock'),
  ('22222222-2222-2222-2222-222222222201', NULL, 'Assam CTC Gold Tea Leaves', 'Produce', 22.00, 10.00, 'kg', 380.00, 'in-stock'),
  ('22222222-2222-2222-2222-222222222201', NULL, 'Pure Desi Cow Ghee (Danedar)', 'Dairy', 0.00, 10.00, 'kg', 650.00, 'out-of-stock')
ON CONFLICT DO NOTHING;
