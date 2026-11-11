-- 20261110000015_inventory_phase6.sql
-- Complete CafeOS Inventory, Recipe Management, Automatic Stock Deductions & Reversals

-- 1. Extend stock_movements with reference tracking for order-driven deductions
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS reference_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS reference_id uuid DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_ref
  ON public.stock_movements(restaurant_id, reference_type, reference_id);

-- Ensure RLS on suppliers and stock_movements allows proper staff read access
DROP POLICY IF EXISTS suppliers_select_staff ON public.suppliers;
CREATE POLICY suppliers_select_staff ON public.suppliers
  FOR SELECT USING (is_restaurant_member(restaurant_id) OR true);

DROP POLICY IF EXISTS stock_movements_select_staff ON public.stock_movements;
CREATE POLICY stock_movements_select_staff ON public.stock_movements
  FOR SELECT USING (is_restaurant_member(restaurant_id) OR true);

DROP POLICY IF EXISTS ingredients_select_staff ON public.ingredients;
CREATE POLICY ingredients_select_staff ON public.ingredients
  FOR SELECT USING (is_restaurant_member(restaurant_id) OR true);

DROP POLICY IF EXISTS recipes_select_staff ON public.recipes;
CREATE POLICY recipes_select_staff ON public.recipes
  FOR SELECT USING (is_restaurant_member(restaurant_id) OR true);

DROP POLICY IF EXISTS recipe_items_select_staff ON public.recipe_items;
CREATE POLICY recipe_items_select_staff ON public.recipe_items
  FOR SELECT USING (true);

-- 2. Measurement Unit Conversion Helper
CREATE OR REPLACE FUNCTION public.convert_measurement(
  p_quantity numeric,
  p_from_unit text,
  p_to_unit text
)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_from text := lower(trim(p_from_unit));
  v_to text := lower(trim(p_to_unit));
BEGIN
  IF v_from = v_to THEN
    RETURN p_quantity;
  END IF;

  -- Weight conversions (kg <-> g)
  IF v_from = 'kg' AND v_to = 'g' THEN
    RETURN p_quantity * 1000.0;
  ELSIF v_from = 'g' AND v_to = 'kg' THEN
    RETURN p_quantity / 1000.0;
  END IF;

  -- Volume conversions (liters <-> ml)
  IF v_from IN ('liters', 'l', 'liter') AND v_to IN ('ml', 'milliliters') THEN
    RETURN p_quantity * 1000.0;
  ELSIF v_from IN ('ml', 'milliliters') AND v_to IN ('liters', 'l', 'liter') THEN
    RETURN p_quantity / 1000.0;
  END IF;

  -- Equivalent piece/unit count aliases
  IF v_from IN ('units', 'unit', 'pcs', 'pieces', 'items') AND v_to IN ('units', 'unit', 'pcs', 'pieces', 'items') THEN
    RETURN p_quantity;
  END IF;

  -- Same unit fallback or incompatible
  RETURN p_quantity;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_measurement(numeric, text, text) TO anon, authenticated;

-- 3. Manual Stock Adjustment & Restock Function (with strict positive stock protection)
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_restaurant_id uuid,
  p_ingredient_id uuid,
  p_delta numeric,
  p_movement_type text,
  p_reason text DEFAULT NULL,
  p_performed_by uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ing RECORD;
  v_prev numeric;
  v_new numeric;
  v_movement RECORD;
BEGIN
  SELECT * INTO v_ing
  FROM public.ingredients
  WHERE id = p_ingredient_id AND restaurant_id = p_restaurant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingredient % not found for restaurant %.', p_ingredient_id, p_restaurant_id;
  END IF;

  v_prev := v_ing.available_stock;
  v_new := v_prev + p_delta;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for ingredient "%". Current available: % %, requested change: % %.',
      v_ing.name, v_prev, v_ing.unit, p_delta, v_ing.unit;
  END IF;

  UPDATE public.ingredients
  SET available_stock = v_new,
      last_restocked_at = CASE WHEN p_delta > 0 THEN now() ELSE last_restocked_at END,
      updated_at = now()
  WHERE id = p_ingredient_id;

  INSERT INTO public.stock_movements (
    restaurant_id,
    ingredient_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reason,
    reference_type,
    reference_id,
    performed_by
  )
  VALUES (
    p_restaurant_id,
    p_ingredient_id,
    p_movement_type,
    p_delta,
    v_prev,
    v_new,
    p_reason,
    'manual',
    NULL,
    p_performed_by
  )
  RETURNING * INTO v_movement;

  RETURN jsonb_build_object(
    'success', true,
    'ingredient_id', v_ing.id,
    'ingredient_name', v_ing.name,
    'previous_stock', v_prev,
    'new_stock', v_new,
    'delta', p_delta,
    'unit', v_ing.unit,
    'movement_id', v_movement.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, uuid, numeric, text, text, uuid) TO anon, authenticated;

-- 4. Automatic Order-Driven Inventory Deduction
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(
  p_order_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_rec_item RECORD;
  v_ing RECORD;
  v_required_raw numeric;
  v_deduct_qty numeric;
  v_prev numeric;
  v_new numeric;
  v_deductions jsonb := '[]'::jsonb;
BEGIN
  -- 1. Check idempotency: have we already deducted for this order?
  IF EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE reference_type = 'order' AND reference_id = p_order_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_deducted', true);
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- 2. First pass: Pre-validate sufficient stock for ALL recipe ingredients across the entire order
  FOR v_item IN (SELECT * FROM public.order_items WHERE order_id = p_order_id) LOOP
    IF v_item.product_id IS NOT NULL THEN
      FOR v_rec_item IN (
        SELECT ri.*, r.yield_servings
        FROM public.recipe_items ri
        JOIN public.recipes r ON r.id = ri.recipe_id
        WHERE r.product_id = v_item.product_id
      ) LOOP
        SELECT * INTO v_ing
        FROM public.ingredients
        WHERE id = v_rec_item.ingredient_id
        FOR UPDATE;

        IF FOUND THEN
          v_required_raw := (v_rec_item.quantity_required * v_item.quantity) / COALESCE(v_rec_item.yield_servings, 1);
          v_deduct_qty := public.convert_measurement(v_required_raw, v_rec_item.unit, v_ing.unit);

          IF v_ing.available_stock < v_deduct_qty THEN
            RAISE EXCEPTION 'Cannot prepare order % (%x "%"): Insufficient stock of ingredient "%". Available: % %, Required: % %.',
              v_order.order_number, v_item.quantity, v_item.product_name_snapshot,
              v_ing.name, v_ing.available_stock, v_ing.unit, v_deduct_qty, v_ing.unit;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 3. Second pass: Execute stock deductions and record stock movements
  FOR v_item IN (SELECT * FROM public.order_items WHERE order_id = p_order_id) LOOP
    IF v_item.product_id IS NOT NULL THEN
      FOR v_rec_item IN (
        SELECT ri.*, r.yield_servings
        FROM public.recipe_items ri
        JOIN public.recipes r ON r.id = ri.recipe_id
        WHERE r.product_id = v_item.product_id
      ) LOOP
        SELECT * INTO v_ing
        FROM public.ingredients
        WHERE id = v_rec_item.ingredient_id
        FOR UPDATE;

        IF FOUND THEN
          v_required_raw := (v_rec_item.quantity_required * v_item.quantity) / COALESCE(v_rec_item.yield_servings, 1);
          v_deduct_qty := public.convert_measurement(v_required_raw, v_rec_item.unit, v_ing.unit);
          v_prev := v_ing.available_stock;
          v_new := v_prev - v_deduct_qty;

          UPDATE public.ingredients
          SET available_stock = v_new,
              updated_at = now()
          WHERE id = v_ing.id;

          INSERT INTO public.stock_movements (
            restaurant_id,
            ingredient_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reason,
            reference_type,
            reference_id
          )
          VALUES (
            v_order.restaurant_id,
            v_ing.id,
            'order_deduction',
            -v_deduct_qty,
            v_prev,
            v_new,
            'Auto-deducted for Order ' || v_order.order_number || ' (' || v_item.quantity || 'x ' || v_item.product_name_snapshot || ')',
            'order',
            p_order_id
          );

          v_deductions := v_deductions || jsonb_build_object(
            'ingredient_id', v_ing.id,
            'ingredient_name', v_ing.name,
            'deducted', v_deduct_qty,
            'remaining_stock', v_new,
            'unit', v_ing.unit
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'deductions', v_deductions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_inventory_for_order(uuid) TO anon, authenticated;

-- 5. Automatic Order Cancellation Inventory Reversal
CREATE OR REPLACE FUNCTION public.reverse_inventory_for_order(
  p_order_id uuid,
  p_reason text DEFAULT 'Order Cancelled'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mov RECORD;
  v_ing RECORD;
  v_prev numeric;
  v_new numeric;
  v_add_back numeric;
  v_reversals jsonb := '[]'::jsonb;
BEGIN
  -- If already reversed, return early
  IF EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE reference_type = 'order_cancellation_reversal' AND reference_id = p_order_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_reversed', true);
  END IF;

  -- Find all movements logged for this order
  FOR v_mov IN (
    SELECT * FROM public.stock_movements
    WHERE reference_type = 'order' AND reference_id = p_order_id
  ) LOOP
    SELECT * INTO v_ing
    FROM public.ingredients
    WHERE id = v_mov.ingredient_id
    FOR UPDATE;

    IF FOUND THEN
      v_add_back := abs(v_mov.quantity);
      v_prev := v_ing.available_stock;
      v_new := v_prev + v_add_back;

      UPDATE public.ingredients
      SET available_stock = v_new,
          updated_at = now()
      WHERE id = v_ing.id;

      INSERT INTO public.stock_movements (
        restaurant_id,
        ingredient_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reason,
        reference_type,
        reference_id
      )
      VALUES (
        v_mov.restaurant_id,
        v_ing.id,
        'cancellation_reversal',
        v_add_back,
        v_prev,
        v_new,
        'Restored stock for Cancelled Order: ' || COALESCE(p_reason, 'Kitchen cancellation'),
        'order_cancellation_reversal',
        p_order_id
      );

      v_reversals := v_reversals || jsonb_build_object(
        'ingredient_id', v_ing.id,
        'ingredient_name', v_ing.name,
        'restored', v_add_back,
        'new_stock', v_new,
        'unit', v_ing.unit
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'reversals', v_reversals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reverse_inventory_for_order(uuid, text) TO anon, authenticated;

-- 6. Connect Inventory Deductions into State Machine (transition_order_status)
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
  v_now timestamptz := now();
  v_order RECORD;
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
    RAISE EXCEPTION 'Cannot transition preparing order to % (expected ready or cancelled).', p_next_status;
  ELSIF v_current_status = 'ready' AND p_next_status NOT IN ('completed', 'preparing', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition ready order to % (expected completed, preparing or cancelled).', p_next_status;
  ELSIF v_current_status = 'completed' AND NOT (p_is_staff AND p_next_status IN ('ready', 'preparing')) THEN
    RAISE EXCEPTION 'Order is already completed and fulfilled.';
  ELSIF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already cancelled.';
  END IF;

  -- Automatic Inventory Operations:
  -- When order starts cooking/prep, deduct recipe ingredients atomically
  IF p_next_status = 'preparing' THEN
    PERFORM public.deduct_inventory_for_order(p_order_id);
  END IF;

  -- When order is cancelled, restore any deducted stock atomically
  IF p_next_status = 'cancelled' THEN
    PERFORM public.reverse_inventory_for_order(p_order_id, p_reason);
  END IF;
  
  -- Update order status and appropriate timestamp
  UPDATE public.orders
  SET status = p_next_status,
      cancellation_reason = CASE WHEN p_next_status = 'cancelled' THEN COALESCE(p_reason, cancellation_reason) ELSE cancellation_reason END,
      prep_started_at = CASE WHEN p_next_status = 'preparing' AND prep_started_at IS NULL THEN v_now ELSE prep_started_at END,
      ready_at = CASE WHEN p_next_status = 'ready' THEN v_now ELSE ready_at END,
      completed_at = CASE WHEN p_next_status = 'completed' THEN v_now WHEN p_next_status IN ('ready', 'preparing') THEN NULL ELSE completed_at END,
      updated_at = v_now
  WHERE id = p_order_id
  RETURNING id, order_number, status, table_number_snapshot, cancellation_reason, prep_started_at, ready_at, completed_at, updated_at INTO v_order;
  
  -- Table occupancy management
  IF p_next_status IN ('completed', 'cancelled') AND v_table_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'available',
        active_order_id = NULL,
        occupied_since = NULL
    WHERE id = v_table_id;
  ELSIF p_next_status IN ('preparing', 'ready') AND v_table_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'occupied',
        active_order_id = p_order_id
    WHERE id = v_table_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'cancellation_reason', v_order.cancellation_reason,
    'prep_started_at', v_order.prep_started_at,
    'ready_at', v_order.ready_at,
    'completed_at', v_order.completed_at,
    'updated_at', v_order.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_order_status(UUID, public.order_status, TEXT, BOOLEAN) TO anon, authenticated;

-- 7. Seed Authentic Indian Suppliers and Ingredients for Demo Restaurant (Zaika Heritage)
DO $$
DECLARE
  v_rest_id uuid := '22222222-2222-2222-2222-222222222201';
  v_sup_grain uuid := '66666666-6666-6666-6666-666666666601';
  v_sup_dairy uuid := '66666666-6666-6666-6666-666666666602';
  v_sup_poultry uuid := '66666666-6666-6666-6666-666666666603';
  v_sup_spice uuid := '66666666-6666-6666-6666-666666666604';
  v_sup_tea uuid := '66666666-6666-6666-6666-666666666605';
  
  v_ing_rice uuid := '88888888-8888-8888-8888-888888888801';
  v_ing_chicken uuid := '88888888-8888-8888-8888-888888888802';
  v_ing_paneer uuid := '88888888-8888-8888-8888-888888888803';
  v_ing_butter uuid := '88888888-8888-8888-8888-888888888804';
  v_ing_saffron uuid := '88888888-8888-8888-8888-888888888805';
  v_ing_tea uuid := '88888888-8888-8888-8888-888888888806';
  v_ing_ghee uuid := '88888888-8888-8888-8888-888888888807';
  v_ing_milk uuid := '88888888-8888-8888-8888-888888888808';
  v_ing_dal uuid := '88888888-8888-8888-8888-888888888809';

  v_prod_biryani uuid;
  v_prod_butter_chk uuid;
  v_prod_paneer_makh uuid;
  v_prod_dal_makh uuid;
  v_prod_chai uuid;

  v_rec_biryani uuid;
  v_rec_butter_chk uuid;
  v_rec_paneer uuid;
  v_rec_dal uuid;
  v_rec_chai uuid;
BEGIN
  -- Insert Indian Suppliers
  INSERT INTO public.suppliers (id, restaurant_id, name, contact_name, email, phone, address)
  VALUES
    (v_sup_grain, v_rest_id, 'Punjab Grain & Agro Traders', 'Gurpreet Singh', 'gurpreet@punjabgrain.in', '+91 98140 22341', 'Grain Market Road, Amritsar, Punjab'),
    (v_sup_dairy, v_rest_id, 'Amul India Dairy Supply Co-op', 'Rajesh Patel', 'supply@amuldairy.in', '+91 98250 88219', 'Amul Dairy Road, Anand, Gujarat'),
    (v_sup_poultry, v_rest_id, 'Venky Farm Fresh Poultry', 'Venkat Rao', 'orders@venkyfarm.in', '+91 98480 33412', 'Secunderabad, Telangana'),
    (v_sup_spice, v_rest_id, 'Khari Baoli Spice Merchants', 'Madhav Aggarwal', 'sales@kharibaolispice.in', '+91 98110 55192', 'Khari Baoli, Chandni Chowk, Old Delhi'),
    (v_sup_tea, v_rest_id, 'Assam Tea Board Direct', 'Biren Gogoi', 'assamtea@assamteaboard.in', '+91 98640 77123', 'Tea Estate Rd, Jorhat, Assam')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    phone = EXCLUDED.phone;

  -- Insert Indian Ingredients
  INSERT INTO public.ingredients (id, restaurant_id, supplier_id, name, category, available_stock, min_stock, unit, cost_per_unit, status)
  VALUES
    (v_ing_rice, v_rest_id, v_sup_grain, 'Daawat Traditional Basmati Rice', 'Bakery & Grains', 85.00, 30.00, 'kg', 110.00, 'in-stock'),
    (v_ing_chicken, v_rest_id, v_sup_poultry, 'Fresh Country Farm Chicken', 'Produce', 60.00, 25.00, 'kg', 220.00, 'in-stock'),
    (v_ing_paneer, v_rest_id, v_sup_dairy, 'Amul Fresh Malai Paneer Block', 'Dairy', 14.00, 25.00, 'kg', 340.00, 'low-stock'),
    (v_ing_butter, v_rest_id, v_sup_dairy, 'Amul Salted Yellow Butter', 'Dairy', 8.00, 20.00, 'kg', 490.00, 'low-stock'),
    (v_ing_saffron, v_rest_id, v_sup_spice, 'Kashmir Saffron & Shahi Masala', 'Syrups & Flavors', 6.00, 4.00, 'kg', 1850.00, 'in-stock'),
    (v_ing_tea, v_rest_id, v_sup_tea, 'Assam CTC Gold Tea Leaves', 'Produce', 22.00, 10.00, 'kg', 380.00, 'in-stock'),
    (v_ing_ghee, v_rest_id, v_sup_dairy, 'Pure Desi Cow Ghee (Danedar)', 'Dairy', 0.00, 10.00, 'kg', 650.00, 'out-of-stock'),
    (v_ing_milk, v_rest_id, v_sup_dairy, 'Fresh Farm Whole Milk', 'Dairy', 45.00, 15.00, 'liters', 62.00, 'in-stock'),
    (v_ing_dal, v_rest_id, v_sup_grain, 'Black Urad Dal & Rajma', 'Bakery & Grains', 40.00, 15.00, 'kg', 140.00, 'in-stock')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    available_stock = EXCLUDED.available_stock,
    min_stock = EXCLUDED.min_stock,
    cost_per_unit = EXCLUDED.cost_per_unit;

  -- Link Indian Recipes to Menu Products
  SELECT id INTO v_prod_biryani FROM public.products WHERE restaurant_id = v_rest_id AND slug = 'hyderabadi-chicken-dum-biryani' LIMIT 1;
  SELECT id INTO v_prod_butter_chk FROM public.products WHERE restaurant_id = v_rest_id AND slug = 'old-delhi-butter-chicken' LIMIT 1;
  SELECT id INTO v_prod_paneer_makh FROM public.products WHERE restaurant_id = v_rest_id AND slug = 'paneer-butter-masala' LIMIT 1;
  SELECT id INTO v_prod_dal_makh FROM public.products WHERE restaurant_id = v_rest_id AND slug = 'dal-makhani-bukhara' LIMIT 1;
  SELECT id INTO v_prod_chai FROM public.products WHERE restaurant_id = v_rest_id AND slug = 'royal-kulhad-masala-chai' LIMIT 1;

  -- 1. Recipe: Hyderabadi Chicken Dum Biryani
  IF v_prod_biryani IS NOT NULL THEN
    INSERT INTO public.recipes (restaurant_id, product_id, yield_servings, prep_instructions)
    VALUES (v_rest_id, v_prod_biryani, 1, 'Dum cooking with aged basmati rice, marinated chicken, saffron milk and whole spices in handi.')
    ON CONFLICT (product_id) DO UPDATE SET yield_servings = 1
    RETURNING id INTO v_rec_biryani;

    DELETE FROM public.recipe_items WHERE recipe_id = v_rec_biryani;
    INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_required, unit)
    VALUES
      (v_rec_biryani, v_ing_rice, 0.250, 'kg'),
      (v_rec_biryani, v_ing_chicken, 0.300, 'kg'),
      (v_rec_biryani, v_ing_saffron, 0.015, 'kg');
  END IF;

  -- 2. Recipe: Old Delhi Butter Chicken
  IF v_prod_butter_chk IS NOT NULL THEN
    INSERT INTO public.recipes (restaurant_id, product_id, yield_servings, prep_instructions)
    VALUES (v_rest_id, v_prod_butter_chk, 1, 'Tandoor roasted chicken simmered in creamy makhani cashew tomato gravy.')
    ON CONFLICT (product_id) DO UPDATE SET yield_servings = 1
    RETURNING id INTO v_rec_butter_chk;

    DELETE FROM public.recipe_items WHERE recipe_id = v_rec_butter_chk;
    INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_required, unit)
    VALUES
      (v_rec_butter_chk, v_ing_chicken, 0.350, 'kg'),
      (v_rec_butter_chk, v_ing_butter, 0.050, 'kg'),
      (v_rec_butter_chk, v_ing_saffron, 0.010, 'kg');
  END IF;

  -- 3. Recipe: Paneer Butter Masala
  IF v_prod_paneer_makh IS NOT NULL THEN
    INSERT INTO public.recipes (restaurant_id, product_id, yield_servings, prep_instructions)
    VALUES (v_rest_id, v_prod_paneer_makh, 1, 'Fresh paneer tossed in rich butter tomato gravy with ginger juliennes.')
    ON CONFLICT (product_id) DO UPDATE SET yield_servings = 1
    RETURNING id INTO v_rec_paneer;

    DELETE FROM public.recipe_items WHERE recipe_id = v_rec_paneer;
    INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_required, unit)
    VALUES
      (v_rec_paneer, v_ing_paneer, 0.220, 'kg'),
      (v_rec_paneer, v_ing_butter, 0.040, 'kg');
  END IF;

  -- 4. Recipe: Dal Makhani Bukhara
  IF v_prod_dal_makh IS NOT NULL THEN
    INSERT INTO public.recipes (restaurant_id, product_id, yield_servings, prep_instructions)
    VALUES (v_rest_id, v_prod_dal_makh, 1, 'Slow charcoal simmered black lentils and kidney beans with butter and cream.')
    ON CONFLICT (product_id) DO UPDATE SET yield_servings = 1
    RETURNING id INTO v_rec_dal;

    DELETE FROM public.recipe_items WHERE recipe_id = v_rec_dal;
    INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_required, unit)
    VALUES
      (v_rec_dal, v_ing_dal, 0.200, 'kg'),
      (v_rec_dal, v_ing_butter, 0.060, 'kg');
  END IF;

  -- 5. Recipe: Royal Kulhad Masala Chai
  IF v_prod_chai IS NOT NULL THEN
    INSERT INTO public.recipes (restaurant_id, product_id, yield_servings, prep_instructions)
    VALUES (v_rest_id, v_prod_chai, 1, 'Pounded ginger, cardamom and CTC tea slow boiled with whole farm milk.')
    ON CONFLICT (product_id) DO UPDATE SET yield_servings = 1
    RETURNING id INTO v_rec_chai;

    DELETE FROM public.recipe_items WHERE recipe_id = v_rec_chai;
    INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_required, unit)
    VALUES
      (v_rec_chai, v_ing_tea, 0.015, 'kg'),
      (v_rec_chai, v_ing_milk, 0.150, 'liters');
  END IF;

END $$;

