-- 20261110000013_super_admin_and_subscriptions.sql
-- Phase 9: SaaS Super Admin, Platform Authorization, Support Tickets, and Subscription Engine

-- 1. Create Platform Support Tickets Table
CREATE TABLE IF NOT EXISTS public.platform_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'technical',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant ON public.platform_support_tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.platform_support_tickets(status);

-- 2. Update Subscription Plans to Indian Rupee (INR) & Accurate Feature Flags
UPDATE public.subscription_plans
SET
  name = 'Starter Tier',
  price_monthly = 2499.00,
  price_yearly = 24990.00,
  description = 'Digital menu, basic table QR ordering & counter billing for small cafes.',
  max_terminals = 1,
  max_orders_per_month = 1000,
  has_kds = false,
  has_inventory = false,
  has_analytics = false,
  has_loyalty = false,
  is_active = true
WHERE slug = 'starter';

UPDATE public.subscription_plans
SET
  name = 'Growth Tier',
  price_monthly = 5999.00,
  price_yearly = 59990.00,
  description = 'Kitchen Display System (KDS), automated recipe inventory & sales analytics.',
  max_terminals = 5,
  max_orders_per_month = 10000,
  has_kds = true,
  has_inventory = true,
  has_analytics = true,
  has_loyalty = false,
  is_active = true
WHERE slug = 'growth';

UPDATE public.subscription_plans
SET
  name = 'Professional Tier',
  price_monthly = 11999.00,
  price_yearly = 119990.00,
  description = 'Multi-station bistro with full advanced reporting, staff roles & multi-branch.',
  max_terminals = 20,
  max_orders_per_month = 50000,
  has_kds = true,
  has_inventory = true,
  has_analytics = true,
  has_loyalty = true,
  is_active = true
WHERE slug = 'professional';

UPDATE public.subscription_plans
SET
  name = 'Enterprise Tier',
  price_monthly = 24999.00,
  price_yearly = 249990.00,
  description = 'Multi-location franchise chains with unlimited POS terminals & custom SLA.',
  max_terminals = 999,
  max_orders_per_month = 999999,
  has_kds = true,
  has_inventory = true,
  has_analytics = true,
  has_loyalty = true,
  is_active = true
WHERE slug = 'enterprise';

-- 3. Seed Super Admin User (superadmin@cafeos.io / CafeOS@SuperAdmin2026)
DO $$
DECLARE
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  v_pw text := crypt('CafeOS@SuperAdmin2026', gen_salt('bf'));
BEGIN
  -- Insert or update auth user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@cafeos.io') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'superadmin@cafeos.io',
      v_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"CafeOS Platform Master Administrator"}'::jsonb,
      now(),
      now()
    );
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'superadmin@cafeos.io';
  END IF;

  -- Insert profile with is_super_admin = true
  INSERT INTO public.profiles (
    id, email, full_name, is_super_admin, phone, created_at, updated_at
  )
  VALUES (
    v_admin_id,
    'superadmin@cafeos.io',
    'CafeOS Platform Master Administrator',
    true,
    '+91 80000 00000',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_super_admin = true,
    full_name = 'CafeOS Platform Master Administrator';
END $$;

-- 4. Server-Side RPC Functions for Super Admin Platform Management

-- 4a. Platform Overview Metrics
CREATE OR REPLACE FUNCTION public.get_platform_overview()
RETURNS jsonb AS $$
DECLARE
  v_total_restaurants bigint;
  v_active_restaurants bigint;
  v_total_users bigint;
  v_active_subscriptions bigint;
  v_mrr numeric;
  v_arr numeric;
  v_result jsonb;
BEGIN
  -- Security check
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Platform Super Administrator privilege required.';
  END IF;

  SELECT count(*) INTO v_total_restaurants FROM public.restaurants;
  SELECT count(*) INTO v_active_restaurants FROM public.restaurants WHERE is_active = true;
  SELECT count(*) INTO v_total_users FROM public.profiles;

  SELECT count(*) INTO v_active_subscriptions
  FROM public.subscriptions
  WHERE status IN ('active', 'trialing');

  -- Calculate MRR based on active restaurant subscription plans
  SELECT coalesce(sum(p.price_monthly), 0) INTO v_mrr
  FROM public.subscriptions s
  JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE s.status IN ('active', 'trialing');

  v_arr := v_mrr * 12;

  v_result := jsonb_build_object(
    'total_restaurants', v_total_restaurants,
    'active_restaurants', v_active_restaurants,
    'total_users', v_total_users,
    'active_subscriptions', v_active_subscriptions,
    'mrr', v_mrr,
    'arr', v_arr,
    'currency', 'INR',
    'currency_symbol', '₹',
    'uptime_pct', 99.98
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4b. Platform Tenants Directory
CREATE OR REPLACE FUNCTION public.get_platform_tenants()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Platform Super Administrator privilege required.';
  END IF;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'name', r.name,
      'slug', r.slug,
      'cuisine', r.cuisine,
      'city', r.city,
      'contact_email', r.contact_email,
      'contact_phone', r.contact_phone,
      'is_active', r.is_active,
      'created_at', r.created_at,
      'plan_name', coalesce(sp.name, 'No Active Plan'),
      'plan_slug', coalesce(sp.slug, 'none'),
      'plan_price', coalesce(sp.price_monthly, 0),
      'subscription_status', coalesce(s.status::text, 'none'),
      'current_period_end', s.current_period_end,
      'cancel_at_period_end', coalesce(s.cancel_at_period_end, false),
      'order_count', (SELECT count(*) FROM public.orders WHERE restaurant_id = r.id)
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb) INTO v_result
  FROM public.restaurants r
  LEFT JOIN public.subscriptions s ON s.restaurant_id = r.id
  LEFT JOIN public.subscription_plans sp ON sp.id = s.plan_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4c. Toggle Tenant Status (Suspend / Reactivate)
CREATE OR REPLACE FUNCTION public.toggle_tenant_status(
  p_restaurant_id uuid,
  p_is_active boolean
)
RETURNS jsonb AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Platform Super Administrator privilege required.';
  END IF;

  UPDATE public.restaurants
  SET is_active = p_is_active, updated_at = now()
  WHERE id = p_restaurant_id
  RETURNING name INTO v_name;

  -- Audit log
  INSERT INTO public.audit_logs (
    restaurant_id, action, resource_type, resource_id, user_id, details
  )
  VALUES (
    p_restaurant_id,
    CASE WHEN p_is_active THEN 'TENANT_REACTIVATED' ELSE 'TENANT_SUSPENDED' END,
    'restaurant',
    p_restaurant_id::text,
    auth.uid(),
    jsonb_build_object('is_active', p_is_active, 'restaurant_name', v_name, 'timestamp', now())
  );

  RETURN jsonb_build_object('success', true, 'restaurant_id', p_restaurant_id, 'is_active', p_is_active);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4d. Assign Subscription Plan to Tenant
CREATE OR REPLACE FUNCTION public.assign_subscription_plan(
  p_restaurant_id uuid,
  p_plan_id uuid,
  p_status text DEFAULT 'active',
  p_duration_months int DEFAULT 12
)
RETURNS jsonb AS $$
DECLARE
  v_sub_id uuid;
  v_plan_name text;
  v_rest_name text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Platform Super Administrator privilege required.';
  END IF;

  SELECT name INTO v_plan_name FROM public.subscription_plans WHERE id = p_plan_id;
  SELECT name INTO v_rest_name FROM public.restaurants WHERE id = p_restaurant_id;

  -- Upsert subscription
  INSERT INTO public.subscriptions (
    restaurant_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, updated_at
  )
  VALUES (
    p_restaurant_id,
    p_plan_id,
    p_status::public.subscription_status,
    now(),
    now() + (p_duration_months || ' months')::interval,
    false,
    now()
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    plan_id = p_plan_id,
    status = p_status::public.subscription_status,
    current_period_end = now() + (p_duration_months || ' months')::interval,
    cancel_at_period_end = false,
    updated_at = now()
  RETURNING id INTO v_sub_id;

  -- Audit Log
  INSERT INTO public.audit_logs (
    restaurant_id, action, resource_type, resource_id, user_id, details
  )
  VALUES (
    p_restaurant_id,
    'PLAN_ASSIGNED',
    'subscription',
    v_sub_id::text,
    auth.uid(),
    jsonb_build_object('plan_id', p_plan_id, 'plan_name', v_plan_name, 'status', p_status, 'months', p_duration_months)
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_sub_id,
    'restaurant_name', v_rest_name,
    'plan_name', v_plan_name,
    'status', p_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4e. Update Subscription Plan Limits & Pricing
CREATE OR REPLACE FUNCTION public.update_plan_config(
  p_plan_id uuid,
  p_price_monthly numeric,
  p_price_yearly numeric,
  p_max_terminals int,
  p_max_orders int,
  p_has_kds boolean,
  p_has_inventory boolean,
  p_has_analytics boolean,
  p_has_loyalty boolean
)
RETURNS jsonb AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Platform Super Administrator privilege required.';
  END IF;

  UPDATE public.subscription_plans
  SET
    price_monthly = p_price_monthly,
    price_yearly = p_price_yearly,
    max_terminals = p_max_terminals,
    max_orders_per_month = p_max_orders,
    has_kds = p_has_kds,
    has_inventory = p_has_inventory,
    has_analytics = p_has_analytics,
    has_loyalty = p_has_loyalty
  WHERE id = p_plan_id;

  RETURN jsonb_build_object('success', true, 'plan_id', p_plan_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Row Level Security Policies
ALTER TABLE public.platform_support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow restaurant members to view their own tickets
CREATE POLICY "restaurant_members_view_tickets"
ON public.platform_support_tickets
FOR SELECT
TO authenticated
USING (
  public.is_super_admin() OR
  public.is_restaurant_member(restaurant_id)
);

-- Allow restaurant members to file support tickets
CREATE POLICY "restaurant_members_insert_tickets"
ON public.platform_support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin() OR
  public.is_restaurant_member(restaurant_id)
);

-- Allow Super Admins to resolve/update support tickets
CREATE POLICY "super_admins_manage_tickets"
ON public.platform_support_tickets
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Ensure subscriptions has a unique constraint on restaurant_id for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_restaurant_id_key'
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_restaurant_id_key UNIQUE (restaurant_id);
  END IF;
END $$;

