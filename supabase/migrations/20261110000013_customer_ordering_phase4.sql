-- ============================================================================
-- CAFÉOS DATABASE ARCHITECTURE - MIGRATION 13: CUSTOMER ORDERING & QR MANAGEMENT (PHASE 4)
-- ============================================================================

-- 1. Schema Alterations for Phase 4
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders (idempotency_key);

-- 2. Enable Realtime Replication for Live Order Tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END $$;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- 3. Human-Readable Order Number Generator Function
CREATE OR REPLACE FUNCTION public.generate_order_number(p_restaurant_id UUID)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_count integer;
  v_prefix text := '#CF-';
  v_order_num text;
BEGIN
  SELECT count(*) + 801 INTO v_count
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND created_at >= date_trunc('day', now());
    
  v_order_num := v_prefix || lpad(v_count::text, 3, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_num AND restaurant_id = p_restaurant_id) LOOP
    v_count := v_count + 1;
    v_order_num := v_prefix || lpad(v_count::text, 3, '0');
  END LOOP;
  
  RETURN v_order_num;
END;
$$;

-- 4. Order Status Transition State Machine Function
CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_order_id UUID,
  p_next_status public.order_status,
  p_reason TEXT DEFAULT NULL,
  p_is_staff BOOLEAN DEFAULT FALSE
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_status public.order_status;
  v_table_id UUID;
  v_updated_at timestamptz;
BEGIN
  SELECT status, table_id INTO v_current_status, v_table_id
  FROM public.orders WHERE id = p_order_id;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;
  
  -- Customer Cancellation Rules:
  IF NOT p_is_staff AND p_next_status = 'cancelled' THEN
    IF v_current_status <> 'pending' THEN
      RAISE EXCEPTION 'Cannot cancel order once cooking or preparation has started (% status). Please contact floor staff.', v_current_status;
    END IF;
  END IF;
  
  -- State Machine Transition Rules:
  IF v_current_status = 'pending' AND p_next_status NOT IN ('accepted', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition pending order to % (expected accepted or cancelled).', p_next_status;
  ELSIF v_current_status = 'accepted' AND p_next_status NOT IN ('preparing', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition accepted order to % (expected preparing or cancelled).', p_next_status;
  ELSIF v_current_status = 'preparing' AND p_next_status NOT IN ('ready', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition preparing order to % (expected ready).', p_next_status;
  ELSIF v_current_status = 'ready' AND p_next_status <> 'completed' THEN
    RAISE EXCEPTION 'Cannot transition ready order to % (expected completed).', p_next_status;
  ELSIF v_current_status = 'completed' THEN
    RAISE EXCEPTION 'Order is already completed and fulfilled.';
  ELSIF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already cancelled.';
  END IF;
  
  v_updated_at := now();
  UPDATE public.orders
  SET status = p_next_status,
      cancellation_reason = CASE WHEN p_next_status = 'cancelled' THEN COALESCE(p_reason, cancellation_reason) ELSE cancellation_reason END,
      updated_at = v_updated_at
  WHERE id = p_order_id;
  
  -- If completed or cancelled, free table
  IF p_next_status IN ('completed', 'cancelled') AND v_table_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'available',
        active_order_id = NULL,
        occupied_since = NULL
    WHERE id = v_table_id;
  END IF;
  
  RETURN jsonb_build_object(
    'id', p_order_id,
    'status', p_next_status,
    'updated_at', v_updated_at,
    'cancellation_reason', p_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_order_status TO anon, authenticated;

-- 5. Atomic & Secure Customer Order Processing Function
CREATE OR REPLACE FUNCTION public.process_customer_order(
  p_restaurant_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_order_type public.order_type,
  p_table_id UUID DEFAULT NULL,
  p_table_number TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT 'counter',
  p_promo_code TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
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

  v_order_num := public.generate_order_number(p_restaurant_id);

  INSERT INTO public.orders (
    restaurant_id, order_number, customer_name, customer_phone,
    table_id, table_number_snapshot, delivery_address,
    order_type, status, subtotal, tax, discount, total,
    payment_method, payment_status, notes, prep_time_minutes,
    idempotency_key
  ) VALUES (
    p_restaurant_id, v_order_num, TRIM(p_customer_name), NULLIF(TRIM(p_customer_phone), ''),
    v_tbl_id, v_tbl_number, NULLIF(TRIM(p_delivery_address), ''),
    p_order_type, 'pending', 0, 0, 0, 0,
    p_payment_method, CASE WHEN p_payment_method = 'counter' THEN 'pending'::payment_status ELSE 'paid'::payment_status END,
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

  -- 8. Return Complete Hydrated Order JSON
  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_num,
    'restaurant_id', p_restaurant_id,
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
    'items', v_inserted_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_customer_order TO anon, authenticated;

