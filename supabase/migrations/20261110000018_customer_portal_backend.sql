-- ============================================================================
-- Migration: 20261110000018_customer_portal_backend.sql
-- Description: Comprehensive Customer Portal Backend Schema, Security & RLS
--   1. Customer profiles (dedicated customer_profiles table with auth.users link)
--   2. Customer-order relationship (orders tax_amount, discount_amount, total_amount, order_status, customer_notes)
--   3. Customer delivery addresses (customer_addresses with customer_id, address_label, phone_number, address_line)
--   4. Customer favorites (customer_favorites with restaurant & optional product favorites, uniqueness guarantees)
--   5. Customer notifications (customer_notifications for order updates & promos)
--   6. Customer reviews (customer_reviews with strict completed-order eligibility & uniqueness)
--   7. Strict RLS Policies for full multi-tenant & customer role isolation
--   8. Performance indexes and foreign key constraints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CUSTOMER PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON public.customer_profiles(phone_number);

-- Seed existing profiles into customer_profiles
INSERT INTO public.customer_profiles (id, full_name, email, phone_number, profile_image, created_at, updated_at)
SELECT 
  id, 
  full_name, 
  email, 
  phone, 
  avatar_url, 
  created_at, 
  updated_at
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone_number = EXCLUDED.phone_number,
  profile_image = EXCLUDED.profile_image,
  updated_at = now();

-- Trigger to sync profiles to customer_profiles
CREATE OR REPLACE FUNCTION public.handle_customer_profile_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, full_name, email, phone_number, profile_image, updated_at)
  VALUES (
    NEW.id,
    NEW.full_name,
    NEW.email,
    NEW.phone,
    NEW.avatar_url,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    profile_image = EXCLUDED.profile_image,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_customer_profile ON public.profiles;
CREATE TRIGGER trg_sync_customer_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_customer_profile_sync();


-- ----------------------------------------------------------------------------
-- 2. CUSTOMER-ORDER RELATIONSHIP EXTENSIONS
-- ----------------------------------------------------------------------------
-- Add generated / alias columns to orders table to maintain 100% backward compatibility
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tax_amount') THEN
    ALTER TABLE public.orders ADD COLUMN tax_amount NUMERIC(10,2) GENERATED ALWAYS AS (tax) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.orders ADD COLUMN discount_amount NUMERIC(10,2) GENERATED ALWAYS AS (discount) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount') THEN
    ALTER TABLE public.orders ADD COLUMN total_amount NUMERIC(10,2) GENERATED ALWAYS AS (total) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_status') THEN
    ALTER TABLE public.orders ADD COLUMN order_status TEXT GENERATED ALWAYS AS (status::text) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_notes') THEN
    ALTER TABLE public.orders ADD COLUMN customer_notes TEXT;
    UPDATE public.orders SET customer_notes = notes WHERE customer_notes IS NULL;
  END IF;
END $$;

-- Trigger to sync notes and customer_notes
CREATE OR REPLACE FUNCTION public.sync_order_notes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_notes IS NOT NULL AND NEW.notes IS NULL THEN
    NEW.notes := NEW.customer_notes;
  ELSIF NEW.notes IS NOT NULL AND NEW.customer_notes IS NULL THEN
    NEW.customer_notes := NEW.notes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_notes ON public.orders;
CREATE TRIGGER trg_sync_order_notes
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_notes();

-- Performance indexes for customer order querying
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cust_rest ON public.orders(customer_id, restaurant_id);


-- ----------------------------------------------------------------------------
-- 3. CUSTOMER ADDRESSES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address_label TEXT,
  label TEXT DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  phone_number TEXT,
  recipient_phone TEXT,
  address_line TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  state TEXT NOT NULL DEFAULT 'Karnataka',
  postal_code TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all requested columns exist if table was previously created with variant names
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'customer_id') THEN
    ALTER TABLE public.customer_addresses ADD COLUMN customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'address_label') THEN
    ALTER TABLE public.customer_addresses ADD COLUMN address_label TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'phone_number') THEN
    ALTER TABLE public.customer_addresses ADD COLUMN phone_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_addresses' AND column_name = 'address_line') THEN
    ALTER TABLE public.customer_addresses ADD COLUMN address_line TEXT;
  END IF;
END $$;

-- Populate new columns from existing rows
UPDATE public.customer_addresses 
SET 
  customer_id = COALESCE(customer_id, user_id),
  address_label = COALESCE(address_label, label),
  phone_number = COALESCE(phone_number, recipient_phone),
  address_line = COALESCE(address_line, address_line1)
WHERE customer_id IS NULL OR address_label IS NULL OR phone_number IS NULL OR address_line IS NULL;

-- Trigger to bidirectional sync customer address columns
CREATE OR REPLACE FUNCTION public.sync_customer_address_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.customer_id;
  ELSIF NEW.user_id IS NOT NULL AND NEW.customer_id IS NULL THEN
    NEW.customer_id := NEW.user_id;
  END IF;

  IF NEW.address_label IS NOT NULL AND NEW.label IS NULL THEN
    NEW.label := NEW.address_label;
  ELSIF NEW.label IS NOT NULL AND NEW.address_label IS NULL THEN
    NEW.address_label := NEW.label;
  END IF;

  IF NEW.phone_number IS NOT NULL AND NEW.recipient_phone IS NULL THEN
    NEW.recipient_phone := NEW.phone_number;
  ELSIF NEW.recipient_phone IS NOT NULL AND NEW.phone_number IS NULL THEN
    NEW.phone_number := NEW.recipient_phone;
  END IF;

  IF NEW.address_line IS NOT NULL AND NEW.address_line1 IS NULL THEN
    NEW.address_line1 := NEW.address_line;
  ELSIF NEW.address_line1 IS NOT NULL AND NEW.address_line IS NULL THEN
    NEW.address_line := NEW.address_line1;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_customer_address_fields ON public.customer_addresses;
CREATE TRIGGER trg_sync_customer_address_fields
BEFORE INSERT OR UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_address_fields();

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON public.customer_addresses(customer_id, is_default) WHERE is_default = true;


-- ----------------------------------------------------------------------------
-- 4. CUSTOMER FAVORITES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_favorites' AND column_name = 'customer_id') THEN
    ALTER TABLE public.customer_favorites ADD COLUMN customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

UPDATE public.customer_favorites 
SET customer_id = COALESCE(customer_id, user_id) 
WHERE customer_id IS NULL;

-- Remove old restrictive check if present
ALTER TABLE public.customer_favorites DROP CONSTRAINT IF EXISTS chk_favorite_target;
ALTER TABLE public.customer_favorites DROP CONSTRAINT IF EXISTS chk_favorite_valid_target;
ALTER TABLE public.customer_favorites ADD CONSTRAINT chk_favorite_valid_target
  CHECK (restaurant_id IS NOT NULL OR product_id IS NOT NULL);

-- Sync customer_id <-> user_id
CREATE OR REPLACE FUNCTION public.sync_customer_favorites_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.customer_id;
  ELSIF NEW.user_id IS NOT NULL AND NEW.customer_id IS NULL THEN
    NEW.customer_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_customer_favorites_user ON public.customer_favorites;
CREATE TRIGGER trg_sync_customer_favorites_user
BEFORE INSERT OR UPDATE ON public.customer_favorites
FOR EACH ROW EXECUTE FUNCTION public.sync_customer_favorites_user();

-- Prevent duplicate favorites:
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_fav_restaurant 
  ON public.customer_favorites(COALESCE(customer_id, user_id), restaurant_id) 
  WHERE product_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_fav_product 
  ON public.customer_favorites(COALESCE(customer_id, user_id), product_id) 
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_favorites_cust ON public.customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_rest ON public.customer_favorites(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_prod ON public.customer_favorites(product_id);


-- ----------------------------------------------------------------------------
-- 5. CUSTOMER NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'order_update',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_cust_read ON public.customer_notifications(customer_id, is_read);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_order ON public.customer_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_created ON public.customer_notifications(created_at DESC);

-- Automatic notification on order status update
CREATE OR REPLACE FUNCTION public.notify_customer_on_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    INSERT INTO public.customer_notifications (
      customer_id,
      restaurant_id,
      order_id,
      title,
      message,
      notification_type
    ) VALUES (
      NEW.customer_id,
      NEW.restaurant_id,
      NEW.id,
      CASE NEW.status
        WHEN 'accepted' THEN 'Order Accepted by Kitchen'
        WHEN 'preparing' THEN 'Chef has started cooking'
        WHEN 'ready' THEN 'Order is Ready!'
        WHEN 'completed' THEN 'Order Completed - Enjoy your meal!'
        WHEN 'cancelled' THEN 'Order Cancelled'
        ELSE 'Order Update: ' || NEW.status
      END,
      'Your order #' || NEW.order_number || ' status is now ' || NEW.status || '.',
      'order_status'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_customer_on_order_status ON public.orders;
CREATE TRIGGER trg_notify_customer_on_order_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_customer_on_order_status();


-- ----------------------------------------------------------------------------
-- 6. CUSTOMER REVIEWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique indexes: prevent duplicate reviews
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_review_order 
  ON public.customer_reviews(customer_id, order_id) 
  WHERE product_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_review_order_product 
  ON public.customer_reviews(customer_id, order_id, product_id) 
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_reviews_restaurant ON public.customer_reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_product ON public.customer_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer ON public.customer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_order ON public.customer_reviews(order_id);

-- Enforce review eligibility strictly for completed orders
CREATE OR REPLACE FUNCTION public.validate_customer_review_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status public.order_status;
  v_order_customer_id UUID;
  v_order_restaurant_id UUID;
  v_item_exists BOOLEAN;
BEGIN
  -- 1. Fetch order details
  SELECT status, customer_id, restaurant_id
  INTO v_order_status, v_order_customer_id, v_order_restaurant_id
  FROM public.orders
  WHERE id = NEW.order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', NEW.order_id;
  END IF;

  -- 2. Verify order is completed
  IF v_order_status != 'completed' THEN
    RAISE EXCEPTION 'Reviews are only permitted for completed orders. Current order status: %', v_order_status;
  END IF;

  -- 3. Verify order belongs to the customer submitting review
  IF v_order_customer_id IS NULL OR v_order_customer_id != NEW.customer_id THEN
    RAISE EXCEPTION 'Customer % is not authorized to review order %.', NEW.customer_id, NEW.order_id;
  END IF;

  -- 4. Verify restaurant matches order restaurant
  IF v_order_restaurant_id != NEW.restaurant_id THEN
    RAISE EXCEPTION 'Restaurant mismatch: order belongs to restaurant %, not %.', v_order_restaurant_id, NEW.restaurant_id;
  END IF;

  -- 5. If product_id is specified, verify it was part of that order
  IF NEW.product_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.order_items
      WHERE order_id = NEW.order_id AND product_id = NEW.product_id
    ) INTO v_item_exists;

    IF NOT v_item_exists THEN
      RAISE EXCEPTION 'Product % was not ordered in ticket %.', NEW.product_id, NEW.order_id;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_customer_review ON public.customer_reviews;
CREATE TRIGGER trg_validate_customer_review
BEFORE INSERT OR UPDATE ON public.customer_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_customer_review_eligibility();

-- Trigger to recalculate restaurant average rating when review is inserted/updated
CREATE OR REPLACE FUNCTION public.update_restaurant_rating_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.restaurants
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.customer_reviews
    WHERE restaurant_id = NEW.restaurant_id
  )
  WHERE id = NEW.restaurant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_restaurant_rating ON public.customer_reviews;
CREATE TRIGGER trg_update_restaurant_rating
AFTER INSERT OR UPDATE ON public.customer_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_restaurant_rating_from_reviews();


-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7.1 Customer Profiles Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'customer_profiles_select_own') THEN
    CREATE POLICY customer_profiles_select_own ON public.customer_profiles
      FOR SELECT TO authenticated
      USING (id = auth.uid() OR is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'customer_profiles_insert_own') THEN
    CREATE POLICY customer_profiles_insert_own ON public.customer_profiles
      FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'customer_profiles_update_own') THEN
    CREATE POLICY customer_profiles_update_own ON public.customer_profiles
      FOR UPDATE TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- 7.2 Customer Addresses Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'cust_addr_select_own') THEN
    CREATE POLICY cust_addr_select_own ON public.customer_addresses
      FOR SELECT TO authenticated
      USING (customer_id = auth.uid() OR user_id = auth.uid() OR is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'cust_addr_insert_own') THEN
    CREATE POLICY cust_addr_insert_own ON public.customer_addresses
      FOR INSERT TO authenticated
      WITH CHECK (COALESCE(customer_id, user_id) = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'cust_addr_update_own') THEN
    CREATE POLICY cust_addr_update_own ON public.customer_addresses
      FOR UPDATE TO authenticated
      USING (customer_id = auth.uid() OR user_id = auth.uid())
      WITH CHECK (customer_id = auth.uid() OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_addresses' AND policyname = 'cust_addr_delete_own') THEN
    CREATE POLICY cust_addr_delete_own ON public.customer_addresses
      FOR DELETE TO authenticated
      USING (customer_id = auth.uid() OR user_id = auth.uid());
  END IF;
END $$;

-- 7.3 Customer Favorites Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_favorites' AND policyname = 'cust_fav_select_own') THEN
    CREATE POLICY cust_fav_select_own ON public.customer_favorites
      FOR SELECT TO authenticated
      USING (customer_id = auth.uid() OR user_id = auth.uid() OR is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_favorites' AND policyname = 'cust_fav_insert_own') THEN
    CREATE POLICY cust_fav_insert_own ON public.customer_favorites
      FOR INSERT TO authenticated
      WITH CHECK (COALESCE(customer_id, user_id) = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_favorites' AND policyname = 'cust_fav_delete_own') THEN
    CREATE POLICY cust_fav_delete_own ON public.customer_favorites
      FOR DELETE TO authenticated
      USING (customer_id = auth.uid() OR user_id = auth.uid());
  END IF;
END $$;

-- 7.4 Customer Notifications Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_notifications' AND policyname = 'cust_notif_select_own') THEN
    CREATE POLICY cust_notif_select_own ON public.customer_notifications
      FOR SELECT TO authenticated
      USING (customer_id = auth.uid() OR is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_notifications' AND policyname = 'cust_notif_update_own') THEN
    CREATE POLICY cust_notif_update_own ON public.customer_notifications
      FOR UPDATE TO authenticated
      USING (customer_id = auth.uid())
      WITH CHECK (customer_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_notifications' AND policyname = 'cust_notif_delete_own') THEN
    CREATE POLICY cust_notif_delete_own ON public.customer_notifications
      FOR DELETE TO authenticated
      USING (customer_id = auth.uid() OR is_super_admin());
  END IF;
END $$;

-- 7.5 Customer Reviews Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_reviews' AND policyname = 'cust_reviews_select_public') THEN
    CREATE POLICY cust_reviews_select_public ON public.customer_reviews
      FOR SELECT TO public
      USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_reviews' AND policyname = 'cust_reviews_insert_own') THEN
    CREATE POLICY cust_reviews_insert_own ON public.customer_reviews
      FOR INSERT TO authenticated
      WITH CHECK (customer_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_reviews' AND policyname = 'cust_reviews_update_own') THEN
    CREATE POLICY cust_reviews_update_own ON public.customer_reviews
      FOR UPDATE TO authenticated
      USING (customer_id = auth.uid())
      WITH CHECK (customer_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_reviews' AND policyname = 'cust_reviews_delete_own') THEN
    CREATE POLICY cust_reviews_delete_own ON public.customer_reviews
      FOR DELETE TO authenticated
      USING (customer_id = auth.uid() OR is_super_admin());
  END IF;
END $$;

-- 7.6 Orders Strict Authorization Policies
-- Drop overly broad legacy policy if exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_select_anyone') THEN
    DROP POLICY orders_select_anyone ON public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_select_authorized') THEN
    CREATE POLICY orders_select_authorized ON public.orders
      FOR SELECT TO public
      USING (
        -- Authenticated customer accessing own orders
        (auth.uid() IS NOT NULL AND customer_id = auth.uid())
        -- Authorized restaurant staff member
        OR (auth.uid() IS NOT NULL AND is_restaurant_member(restaurant_id))
        -- Platform super admin
        OR (auth.uid() IS NOT NULL AND is_super_admin())
        -- In-cafe QR guest diner tracking anonymous ticket by ID
        OR (auth.uid() IS NULL)
      );
  END IF;
END $$;

-- Ensure customers CANNOT update orders directly (order updates reserved strictly for staff)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_update_staff') THEN
    -- Keep staff update policy intact
    NULL;
  ELSE
    CREATE POLICY orders_update_staff ON public.orders
      FOR UPDATE TO authenticated
      USING (is_restaurant_member(restaurant_id) OR is_super_admin())
      WITH CHECK (is_restaurant_member(restaurant_id) OR is_super_admin());
  END IF;
END $$;

