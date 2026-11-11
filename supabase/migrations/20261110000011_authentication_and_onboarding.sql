-- 20261110000011_authentication_and_onboarding.sql
-- Phase 2: Authentication, Tenant Onboarding RPC, Multi-Restaurant Workspaces & RBAC

-- 1. Ensure Trigger on auth.users for automatic profile creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2. Enhance restaurant_members RLS policy to allow users to view their own memberships
DROP POLICY IF EXISTS "restaurant_members_select" ON public.restaurant_members;
DROP POLICY IF EXISTS "restaurant_members_select_own" ON public.restaurant_members;
CREATE POLICY "restaurant_members_select" ON public.restaurant_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_restaurant_member(restaurant_id));

-- 3. Atomic Onboarding RPC: create_restaurant_workspace
CREATE OR REPLACE FUNCTION public.create_restaurant_workspace(
  p_name text,
  p_slug text,
  p_cuisine text DEFAULT 'Indian Specialty & Fine Dining',
  p_logo_url text DEFAULT '',
  p_address text DEFAULT '',
  p_city text DEFAULT 'Mumbai',
  p_state text DEFAULT 'Maharashtra',
  p_postal_code text DEFAULT '',
  p_country text DEFAULT 'India',
  p_phone text DEFAULT '',
  p_email text DEFAULT '',
  p_currency text DEFAULT 'INR',
  p_currency_symbol text DEFAULT '₹',
  p_tax_percentage numeric DEFAULT 5.00,
  p_tax_number text DEFAULT '',
  p_open_time text DEFAULT '09:00',
  p_close_time text DEFAULT '23:00'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_restaurant_id uuid;
  v_slug text;
  v_result jsonb;
  v_full_address text;
  v_full_city text;
  v_hours text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Only registered users can initialize a restaurant workspace.';
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, email, full_name)
  SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', '')
  FROM auth.users
  WHERE id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  -- Ensure unique, URL-safe slug
  v_slug := lower(regexp_replace(trim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
  IF v_slug = '' OR v_slug IS NULL THEN
    v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;

  -- Check if slug already exists, if so append random suffix
  IF EXISTS (SELECT 1 FROM public.restaurants WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
  END IF;

  v_full_address := COALESCE(NULLIF(p_address, ''), '100 Feet Road');
  v_full_city := p_city || CASE WHEN p_state <> '' THEN ', ' || p_state ELSE '' END;
  v_hours := COALESCE(p_open_time, '09:00') || ' - ' || COALESCE(p_close_time, '23:00');

  -- 1. Insert restaurant matching schema
  INSERT INTO public.restaurants (
    name,
    slug,
    cuisine,
    logo_url,
    address,
    city,
    contact_phone,
    contact_email,
    opening_hours,
    currency,
    currency_symbol,
    tax_percentage,
    delivery_available,
    takeaway_available,
    is_active
  )
  VALUES (
    p_name,
    v_slug,
    p_cuisine,
    COALESCE(NULLIF(p_logo_url, ''), 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80'),
    v_full_address,
    v_full_city,
    p_phone,
    p_email,
    v_hours,
    COALESCE(p_currency, 'INR'),
    COALESCE(p_currency_symbol, '₹'),
    COALESCE(p_tax_percentage, 5.00),
    true,
    true,
    true
  )
  RETURNING id INTO v_restaurant_id;

  -- 2. Insert owner membership
  INSERT INTO public.restaurant_members (
    restaurant_id,
    user_id,
    role,
    status
  )
  VALUES (
    v_restaurant_id,
    v_user_id,
    'owner',
    'active'
  );

  -- 3. Insert default settings
  INSERT INTO public.restaurant_settings (
    restaurant_id,
    auto_accept_orders,
    kds_chime_enabled,
    sound_volume,
    tax_id_number,
    receipt_header,
    low_stock_threshold_alert
  )
  VALUES (
    v_restaurant_id,
    true,
    true,
    80,
    p_tax_number,
    p_name,
    true
  );

  -- 4. Seed starter Indian menu categories
  INSERT INTO public.categories (restaurant_id, name, slug, icon, sort_order)
  VALUES
    (v_restaurant_id, 'Dum Biryanis', 'biryani', '🍛', 1),
    (v_restaurant_id, 'Tandoori Starters', 'starters', '🍢', 2),
    (v_restaurant_id, 'Royal Curries', 'curries', '🥘', 3),
    (v_restaurant_id, 'Artisan Breads', 'breads', '🫓', 4),
    (v_restaurant_id, 'Kulhad Chai & Beverages', 'beverages', '☕', 5),
    (v_restaurant_id, 'Mithai & Desserts', 'desserts', '🍧', 6);

  -- 5. Seed starter restaurant tables
  INSERT INTO public.restaurant_tables (restaurant_id, table_number, capacity, section, status)
  VALUES
    (v_restaurant_id, 'T-01', 2, 'Main Dining', 'available'),
    (v_restaurant_id, 'T-02', 4, 'Main Dining', 'available'),
    (v_restaurant_id, 'T-03', 4, 'Main Dining', 'available'),
    (v_restaurant_id, 'T-04', 6, 'Family Lounge', 'available'),
    (v_restaurant_id, 'T-05', 2, 'Outdoor Terrace', 'available'),
    (v_restaurant_id, 'T-06', 4, 'Outdoor Terrace', 'available');

  -- 6. Record audit log entry
  INSERT INTO public.audit_logs (
    restaurant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    v_restaurant_id,
    v_user_id,
    'create_workspace',
    'restaurants',
    v_restaurant_id::text,
    jsonb_build_object('name', p_name, 'slug', v_slug, 'role', 'owner')
  );

  SELECT jsonb_build_object(
    'restaurant', row_to_json(r),
    'role', 'owner'
  )
  INTO v_result
  FROM public.restaurants r
  WHERE r.id = v_restaurant_id;

  RETURN v_result;
END;
$$;

-- 4. Get User Workspaces Function: Returns all restaurants where user has a membership
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE (
  restaurant_id uuid,
  restaurant_name text,
  restaurant_slug text,
  restaurant_cuisine text,
  restaurant_logo_url text,
  currency text,
  currency_symbol text,
  tax_percentage numeric,
  user_role text,
  member_status text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    r.slug AS restaurant_slug,
    r.cuisine AS restaurant_cuisine,
    r.logo_url AS restaurant_logo_url,
    r.currency,
    r.currency_symbol,
    r.tax_percentage,
    m.role::text AS user_role,
    m.status AS member_status,
    r.is_active
  FROM public.restaurant_members m
  JOIN public.restaurants r ON m.restaurant_id = r.id
  WHERE m.user_id = auth.uid()
  ORDER BY m.created_at ASC;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_restaurant_workspace TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_workspaces TO authenticated;
