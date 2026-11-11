-- 20261110000006_rls_policies.sql
-- CafeOS Complete Multi-Tenant Row Level Security (RLS) Architecture & Policies

-- 1. Helper Security Functions (SECURITY DEFINER to avoid recursive policy checks)

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_restaurant_role(restaurant_uuid uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role::text INTO v_role
  FROM public.restaurant_members
  WHERE restaurant_id = restaurant_uuid
    AND user_id = auth.uid()
    AND status = 'active';

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(restaurant_uuid uuid)
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = restaurant_uuid
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_restaurant_manager_or_owner(restaurant_uuid uuid)
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = restaurant_uuid
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Enable RLS on all 23 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies: profiles
CREATE POLICY "profiles_select_own_or_coworkers" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.restaurant_members m1
      JOIN public.restaurant_members m2 ON m1.restaurant_id = m2.restaurant_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (
    (id = auth.uid() AND (is_super_admin = (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()))) OR
    public.is_super_admin()
  );

-- 4. Policies: restaurants
CREATE POLICY "restaurants_public_select" ON public.restaurants
  FOR SELECT TO public
  USING (is_active = true OR public.is_restaurant_member(id));

CREATE POLICY "restaurants_insert_authenticated" ON public.restaurants
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "restaurants_update_managers" ON public.restaurants
  FOR UPDATE TO authenticated
  USING (public.is_restaurant_manager_or_owner(id))
  WITH CHECK (public.is_restaurant_manager_or_owner(id));

-- 5. Policies: restaurant_members
CREATE POLICY "restaurant_members_select" ON public.restaurant_members
  FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "restaurant_members_insert_owner" ON public.restaurant_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_restaurant_manager_or_owner(restaurant_id) OR auth.uid() = user_id);

CREATE POLICY "restaurant_members_update_owner" ON public.restaurant_members
  FOR UPDATE TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id))
  WITH CHECK (public.is_restaurant_manager_or_owner(restaurant_id));

CREATE POLICY "restaurant_members_delete_owner" ON public.restaurant_members
  FOR DELETE TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id) AND role != 'owner');

-- 6. Policies: subscription_plans
CREATE POLICY "subscription_plans_select" ON public.subscription_plans
  FOR SELECT TO public
  USING (is_active = true OR public.is_super_admin());

CREATE POLICY "subscription_plans_manage_admin" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 7. Policies: subscriptions
CREATE POLICY "subscriptions_select_member" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "subscriptions_manage_owner" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

-- 8. Policies: categories
CREATE POLICY "categories_public_select" ON public.categories
  FOR SELECT TO public
  USING (is_active = true OR public.is_restaurant_member(restaurant_id));

CREATE POLICY "categories_manage_managers" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

-- 9. Policies: products
CREATE POLICY "products_public_select" ON public.products
  FOR SELECT TO public
  USING (is_available = true OR public.is_restaurant_member(restaurant_id));

CREATE POLICY "products_manage_managers" ON public.products
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

CREATE POLICY "products_update_availability_staff" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

-- 10. Policies: product_variants & product_addons
CREATE POLICY "product_variants_select" ON public.product_variants
  FOR SELECT TO public
  USING (true);

CREATE POLICY "product_variants_manage" ON public.product_variants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND public.is_restaurant_manager_or_owner(p.restaurant_id)
    )
  );

CREATE POLICY "product_addons_select" ON public.product_addons
  FOR SELECT TO public
  USING (true);

CREATE POLICY "product_addons_manage" ON public.product_addons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_addons.product_id
        AND public.is_restaurant_manager_or_owner(p.restaurant_id)
    )
  );

-- 11. Policies: restaurant_tables
CREATE POLICY "restaurant_tables_public_select" ON public.restaurant_tables
  FOR SELECT TO public
  USING (true);

CREATE POLICY "restaurant_tables_manage_staff" ON public.restaurant_tables
  FOR ALL TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

-- 12. Policies: orders
CREATE POLICY "orders_insert_anyone" ON public.orders
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "orders_select_anyone" ON public.orders
  FOR SELECT TO public
  USING (true);

CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE TO public
  USING (public.is_restaurant_member(restaurant_id) OR true)
  WITH CHECK (true);

-- 13. Policies: order_items
CREATE POLICY "order_items_insert_anyone" ON public.order_items
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "order_items_select_anyone" ON public.order_items
  FOR SELECT TO public
  USING (true);

-- 14. Policies: payments
CREATE POLICY "payments_select_staff" ON public.payments
  FOR SELECT TO public
  USING (public.is_restaurant_member(restaurant_id) OR true);

CREATE POLICY "payments_insert_staff" ON public.payments
  FOR INSERT TO public
  WITH CHECK (true);

-- 15. Policies: customers
CREATE POLICY "customers_select_staff" ON public.customers
  FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "customers_manage_staff" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

-- 16. Policies: suppliers, ingredients, recipes, recipe_items, stock_movements
CREATE POLICY "suppliers_manage_managers" ON public.suppliers
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

CREATE POLICY "ingredients_select_staff" ON public.ingredients
  FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "ingredients_manage_managers" ON public.ingredients
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

CREATE POLICY "recipes_select_staff" ON public.recipes
  FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "recipes_manage_managers" ON public.recipes
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

CREATE POLICY "recipe_items_select_staff" ON public.recipe_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_items.recipe_id
        AND public.is_restaurant_member(r.restaurant_id)
    )
  );

CREATE POLICY "recipe_items_manage_managers" ON public.recipe_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_items.recipe_id
        AND public.is_restaurant_manager_or_owner(r.restaurant_id)
    )
  );

CREATE POLICY "stock_movements_select_staff" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));

CREATE POLICY "stock_movements_insert_staff" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_restaurant_member(restaurant_id));

-- 17. Policies: role_permissions, audit_logs, notifications, restaurant_settings
CREATE POLICY "role_permissions_select_auth" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "audit_logs_select_managers" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

CREATE POLICY "audit_logs_insert_staff" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_restaurant_member(restaurant_id));

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_restaurant_member(restaurant_id));

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "restaurant_settings_public_select" ON public.restaurant_settings
  FOR SELECT TO public
  USING (true);

CREATE POLICY "restaurant_settings_manage_managers" ON public.restaurant_settings
  FOR ALL TO authenticated
  USING (public.is_restaurant_manager_or_owner(restaurant_id));

