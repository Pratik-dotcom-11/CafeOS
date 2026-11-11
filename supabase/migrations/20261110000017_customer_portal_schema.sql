-- ==============================================================================
-- Migration: 20261110000017_customer_portal_schema.sql
-- Description: Customer Portal Schema, Addresses, Favorites, Rewards, 
--              Customer Support, and Enhanced Order Linking with RLS
-- ==============================================================================

-- 1. Customer Addresses Table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home', -- 'Home', 'Work', 'Other'
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  state TEXT NOT NULL DEFAULT 'Karnataka',
  postal_code TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user 
  ON public.customer_addresses(user_id);

-- 2. Customer Favorites Table (Restaurants & Dishes)
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_favorite_target CHECK (
    (restaurant_id IS NOT NULL AND product_id IS NULL) OR
    (restaurant_id IS NULL AND product_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_restaurant_fav 
  ON public.customer_favorites(user_id, restaurant_id) 
  WHERE restaurant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_product_fav 
  ON public.customer_favorites(user_id, product_id) 
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_favorites_user 
  ON public.customer_favorites(user_id);

-- 3. Customer Rewards & Points Ledger
CREATE TABLE IF NOT EXISTS public.customer_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 100, -- 100 welcome coins
  lifetime_points INTEGER NOT NULL DEFAULT 100,
  tier TEXT NOT NULL DEFAULT 'Bronze', -- 'Bronze', 'Silver', 'Gold', 'VIP'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points_delta INTEGER NOT NULL, -- Positive for earned, negative for redeemed
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_tx_user 
  ON public.customer_reward_transactions(user_id, created_at DESC);

-- 4. Customer Support Tickets
CREATE TABLE IF NOT EXISTS public.customer_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'urgent'
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_support_user 
  ON public.customer_support_tickets(user_id, created_at DESC);

-- 5. Enable RLS on New Tables
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_tickets ENABLE ROW LEVEL SECURITY;

-- 6. Customer Addresses Policies
DROP POLICY IF EXISTS "customer_addresses_select_own" ON public.customer_addresses;
CREATE POLICY "customer_addresses_select_own" ON public.customer_addresses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "customer_addresses_insert_own" ON public.customer_addresses;
CREATE POLICY "customer_addresses_insert_own" ON public.customer_addresses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "customer_addresses_update_own" ON public.customer_addresses;
CREATE POLICY "customer_addresses_update_own" ON public.customer_addresses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "customer_addresses_delete_own" ON public.customer_addresses;
CREATE POLICY "customer_addresses_delete_own" ON public.customer_addresses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 7. Customer Favorites Policies
DROP POLICY IF EXISTS "customer_favorites_select_own" ON public.customer_favorites;
CREATE POLICY "customer_favorites_select_own" ON public.customer_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "customer_favorites_manage_own" ON public.customer_favorites;
CREATE POLICY "customer_favorites_manage_own" ON public.customer_favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Customer Rewards Policies
DROP POLICY IF EXISTS "customer_rewards_select_own" ON public.customer_rewards;
CREATE POLICY "customer_rewards_select_own" ON public.customer_rewards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "customer_rewards_tx_select_own" ON public.customer_reward_transactions;
CREATE POLICY "customer_rewards_tx_select_own" ON public.customer_reward_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

-- 9. Customer Support Policies
DROP POLICY IF EXISTS "customer_support_select_own" ON public.customer_support_tickets;
CREATE POLICY "customer_support_select_own" ON public.customer_support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "customer_support_insert_own" ON public.customer_support_tickets;
CREATE POLICY "customer_support_insert_own" ON public.customer_support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 10. Update Orders and Order Items RLS for Authenticated Customers
DROP POLICY IF EXISTS "orders_select_customer" ON public.orders;
CREATE POLICY "orders_select_customer" ON public.orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR is_restaurant_member(restaurant_id) OR is_super_admin());

DROP POLICY IF EXISTS "order_items_select_customer" ON public.order_items;
CREATE POLICY "order_items_select_customer" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.customer_id = auth.uid() OR is_restaurant_member(o.restaurant_id) OR is_super_admin())
  ));

-- 11. Function: Initialize Customer Rewards Profile
CREATE OR REPLACE FUNCTION public.initialize_customer_rewards(p_user_id UUID)
RETURNS public.customer_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward public.customer_rewards;
BEGIN
  INSERT INTO public.customer_rewards (user_id, points_balance, lifetime_points, tier)
  VALUES (p_user_id, 100, 100, 'Bronze')
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_reward;

  INSERT INTO public.customer_reward_transactions (user_id, points_delta, description)
  VALUES (p_user_id, 100, 'Welcome to CaféOS Dining! Bonus 100 Coins credited.')
  ON CONFLICT DO NOTHING;

  RETURN v_reward;
END;
$$;

-- 12. Function: Enhanced process_customer_order with customer_id & loyalty credit
CREATE OR REPLACE FUNCTION public.process_customer_order(
  p_restaurant_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_order_type public.order_type DEFAULT 'dine-in',
  p_table_id UUID DEFAULT NULL,
  p_table_number TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT 'counter',
  p_promo_code TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_customer_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_json jsonb;
  v_rest_id UUID;
  v_rest_name TEXT;
  v_tax_percentage NUMERIC;
  v_is_active BOOLEAN;
  v_delivery_available BOOLEAN;
  v_tbl_id UUID;
  v_tbl_number TEXT;
  
  v_subtotal NUMERIC := 0;
  v_tax NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_max_prep_time INTEGER := 15;
  v_order_num TEXT;
  v_order_id UUID;
  v_coins_earned INTEGER := 0;
  
  v_item jsonb;
  v_prod_id UUID;
  v_prod_name TEXT;
  v_prod_price NUMERIC;
  v_prod_is_veg BOOLEAN;
  v_prod_is_available BOOLEAN;
  v_prod_prep_time INTEGER;
  v_qty INTEGER;
  v_unit_price NUMERIC;
  v_item_total NUMERIC;
  v_variant_name TEXT;
  v_variant_adj NUMERIC;
  v_addon_id_text TEXT;
  v_addon_group TEXT;
  v_addon_opt TEXT;
  v_addon_price NUMERIC;
  v_selected_options jsonb;
  
  v_inserted_items jsonb := '[]'::jsonb;
BEGIN
  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) <> '' THEN
    SELECT jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'restaurant_id', o.restaurant_id,
      'customer_id', o.customer_id,
      'customer_name', o.customer_name,
      'customer_phone', o.customer_phone,
      'order_type', o.order_type,
      'table_id', o.table_id,
      'table_number_snapshot', o.table_number_snapshot,
      'delivery_address', o.delivery_address,
      'status', o.status,
      'subtotal', o.subtotal,
      'tax', o.tax,
      'discount', o.discount,
      'total', o.total,
      'payment_method', o.payment_method,
      'payment_status', o.payment_status,
      'notes', o.notes,
      'prep_time_minutes', o.prep_time_minutes,
      'estimated_ready_at', o.estimated_ready_at,
      'created_at', o.created_at,
      'is_duplicate', true,
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name_snapshot,
          'price', oi.price_snapshot,
          'quantity', oi.quantity,
          'item_total', oi.item_total,
          'is_veg', oi.is_veg_snapshot,
          'selected_options', oi.selected_options_snapshot,
          'special_instructions', oi.special_instructions
        ))
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ), '[]'::jsonb)
    ) INTO v_existing_json
    FROM public.orders o
    WHERE o.idempotency_key = p_idempotency_key;

    IF v_existing_json IS NOT NULL THEN
      RETURN v_existing_json;
    END IF;
  END IF;

  -- 2. Validate Restaurant
  SELECT r.id, r.name, r.tax_percentage, r.is_active, r.delivery_available
  INTO v_rest_id, v_rest_name, v_tax_percentage, v_is_active, v_delivery_available
  FROM public.restaurants r
  WHERE r.id = p_restaurant_id;

  IF v_rest_id IS NULL THEN
    RAISE EXCEPTION 'Restaurant % does not exist.', p_restaurant_id;
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Restaurant "%" is currently closed.', v_rest_name;
  END IF;

  IF p_order_type = 'delivery' AND NOT v_delivery_available THEN
    RAISE EXCEPTION 'Delivery service is not available for this restaurant.';
  END IF;

  -- 3. Validate Table (if dine-in)
  IF p_order_type = 'dine-in' THEN
    IF p_table_id IS NOT NULL THEN
      SELECT t.id, t.table_number
      INTO v_tbl_id, v_tbl_number
      FROM public.restaurant_tables t
      WHERE t.id = p_table_id AND t.restaurant_id = p_restaurant_id;

      IF v_tbl_id IS NULL THEN
        RAISE EXCEPTION 'Table % does not belong to this restaurant.', p_table_id;
      END IF;
    ELSE
      v_tbl_number := COALESCE(NULLIF(TRIM(p_table_number), ''), 'Dine-In');
    END IF;
  END IF;

  -- 4. Validate Items & Recalculate Prices Strictly from DB
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cannot place an order with 0 items.';
  END IF;

  -- Create order record with customer_id
  v_order_num := public.generate_order_number(p_restaurant_id);

  INSERT INTO public.orders (
    restaurant_id, customer_id, order_number, customer_name, customer_phone,
    table_id, table_number_snapshot, delivery_address,
    order_type, status, subtotal, tax, discount, total,
    payment_method, payment_status, notes, prep_time_minutes,
    idempotency_key
  ) VALUES (
    p_restaurant_id, p_customer_id, v_order_num, TRIM(p_customer_name), NULLIF(TRIM(p_customer_phone), ''),
    v_tbl_id, v_tbl_number, NULLIF(TRIM(p_delivery_address), ''),
    p_order_type, 'pending', 0, 0, 0, 0,
    p_payment_method, CASE WHEN p_payment_method = 'counter' THEN 'pending'::public.payment_status ELSE 'paid'::public.payment_status END,
    NULLIF(TRIM(p_notes), ''), 15,
    NULLIF(TRIM(p_idempotency_key), '')
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::int, 1));

    -- Look up real product in DB
    SELECT p.name, p.price, p.is_veg, p.is_available, COALESCE(p.prep_time_minutes, 15)
    INTO v_prod_name, v_prod_price, v_prod_is_veg, v_prod_is_available, v_prod_prep_time
    FROM public.products p
    WHERE p.id = v_prod_id AND p.restaurant_id = p_restaurant_id;

    IF v_prod_name IS NULL THEN
      RAISE EXCEPTION 'Product % is not on the menu for this restaurant.', v_prod_id;
    END IF;

    IF NOT v_prod_is_available THEN
      RAISE EXCEPTION 'Item "%" is currently sold out / unavailable.', v_prod_name;
    END IF;

    v_unit_price := v_prod_price;
    v_selected_options := '[]'::jsonb;

    -- Look up portion variant in DB
    IF v_item ? 'variant_id' AND (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> '' THEN
      SELECT pv.name, pv.price_adjustment
      INTO v_variant_name, v_variant_adj
      FROM public.product_variants pv
      WHERE pv.id = (v_item->>'variant_id')::uuid AND pv.product_id = v_prod_id;

      IF v_variant_name IS NOT NULL THEN
        v_unit_price := v_unit_price + v_variant_adj;
        v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
          'groupTitle', 'Portion Size',
          'optionName', v_variant_name,
          'price', v_variant_adj
        ));
      END IF;
    END IF;

    -- Look up add-on options in DB
    IF v_item ? 'selected_addon_ids' AND jsonb_array_length(COALESCE(v_item->'selected_addon_ids', '[]'::jsonb)) > 0 THEN
      FOR v_addon_id_text IN SELECT jsonb_array_elements_text(v_item->'selected_addon_ids') LOOP
        SELECT pa.group_title, pa.option_name, pa.price
        INTO v_addon_group, v_addon_opt, v_addon_price
        FROM public.product_addons pa
        WHERE pa.id = v_addon_id_text::uuid AND pa.product_id = v_prod_id;

        IF v_addon_opt IS NOT NULL THEN
          v_unit_price := v_unit_price + v_addon_price;
          v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
            'groupTitle', v_addon_group,
            'optionName', v_addon_opt,
            'price', v_addon_price
          ));
        END IF;
      END LOOP;
    END IF;

    v_item_total := ROUND(v_unit_price * v_qty, 2);
    v_subtotal := v_subtotal + v_item_total;

    IF v_prod_prep_time > v_max_prep_time THEN
      v_max_prep_time := v_prod_prep_time;
    END IF;

    -- Insert snapshot item
    INSERT INTO public.order_items (
      order_id, product_id, product_name_snapshot, price_snapshot,
      quantity, is_veg_snapshot, selected_options_snapshot,
      special_instructions, item_total
    ) VALUES (
      v_order_id, v_prod_id, v_prod_name, v_unit_price,
      v_qty, v_prod_is_veg, v_selected_options,
      NULLIF(TRIM(v_item->>'special_instructions'), ''), v_item_total
    );

    v_inserted_items := v_inserted_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_prod_id,
      'product_name', v_prod_name,
      'price', v_unit_price,
      'quantity', v_qty,
      'item_total', v_item_total,
      'is_veg', v_prod_is_veg,
      'selected_options', v_selected_options,
      'special_instructions', v_item->>'special_instructions'
    ));
  END LOOP;

  -- 5. Calculate Tax and Discounts
  v_tax := ROUND(v_subtotal * (COALESCE(v_tax_percentage, 5.0) / 100.0), 2);

  IF UPPER(TRIM(COALESCE(p_promo_code, ''))) IN ('CAFE10', 'WELCOME') THEN
    v_discount := ROUND(v_subtotal * 0.10, 2);
  ELSE
    v_discount := 0;
  END IF;

  v_total := ROUND(v_subtotal + v_tax - v_discount, 2);

  -- 6. Update order totals and estimated ready time
  UPDATE public.orders
  SET subtotal = v_subtotal,
      tax = v_tax,
      discount = v_discount,
      total = v_total,
      prep_time_minutes = v_max_prep_time,
      estimated_ready_at = now() + (v_max_prep_time || ' minutes')::interval,
      updated_at = now()
  WHERE id = v_order_id;

  -- 7. Update Table Occupancy if dine-in
  IF v_tbl_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'occupied',
        active_order_id = v_order_id,
        occupied_since = now(),
        updated_at = now()
    WHERE id = v_tbl_id;
  END IF;

  -- 8. Award Customer Loyalty Rewards if customer_id provided
  IF p_customer_id IS NOT NULL THEN
    v_coins_earned := GREATEST(10, ROUND(v_subtotal * 0.05)::INTEGER); -- 5% reward coins

    INSERT INTO public.customer_rewards (user_id, points_balance, lifetime_points, tier)
    VALUES (p_customer_id, 100 + v_coins_earned, 100 + v_coins_earned, 'Bronze')
    ON CONFLICT (user_id) DO UPDATE SET
      points_balance = public.customer_rewards.points_balance + v_coins_earned,
      lifetime_points = public.customer_rewards.lifetime_points + v_coins_earned,
      tier = CASE 
        WHEN public.customer_rewards.lifetime_points + v_coins_earned >= 2500 THEN 'VIP'
        WHEN public.customer_rewards.lifetime_points + v_coins_earned >= 1000 THEN 'Gold'
        WHEN public.customer_rewards.lifetime_points + v_coins_earned >= 500 THEN 'Silver'
        ELSE 'Bronze'
      END,
      updated_at = now();

    INSERT INTO public.customer_reward_transactions (user_id, order_id, points_delta, description)
    VALUES (
      p_customer_id, 
      v_order_id, 
      v_coins_earned, 
      'Dining Reward: Order ' || v_order_num || ' (+5% coins)'
    );
  END IF;

  -- 9. Return Complete Hydrated Order JSON
  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_num,
    'restaurant_id', p_restaurant_id,
    'customer_id', p_customer_id,
    'customer_name', TRIM(p_customer_name),
    'customer_phone', NULLIF(TRIM(p_customer_phone), ''),
    'order_type', p_order_type,
    'table_id', v_tbl_id,
    'table_number_snapshot', v_tbl_number,
    'delivery_address', NULLIF(TRIM(p_delivery_address), ''),
    'status', 'pending',
    'subtotal', v_subtotal,
    'tax', v_tax,
    'discount', v_discount,
    'total', v_total,
    'payment_method', p_payment_method,
    'payment_status', CASE WHEN p_payment_method = 'counter' THEN 'pending' ELSE 'paid' END,
    'notes', NULLIF(TRIM(p_notes), ''),
    'prep_time_minutes', v_max_prep_time,
    'estimated_ready_at', now() + (v_max_prep_time || ' minutes')::interval,
    'created_at', now(),
    'is_duplicate', false,
    'coins_earned', v_coins_earned,
    'items', v_inserted_items
  );
END;
$$;

