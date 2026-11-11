-- 20261110000003_orders_and_tables.sql
-- CafeOS Orders, Restaurant Tables, Order Items, Payments, Customer CRM

-- 1. Restaurant Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  section text NOT NULL DEFAULT 'Main Dining',
  status text NOT NULL DEFAULT 'available',
  guest_count integer,
  active_order_id uuid,
  occupied_since timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_table_restaurant_number UNIQUE (restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON public.restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.restaurant_tables(restaurant_id, status);

-- 2. Orders & Status Enums
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_type AS ENUM ('dine-in', 'takeaway', 'delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('card', 'upi', 'cash', 'paypal', 'counter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  customer_name text NOT NULL DEFAULT 'Guest',
  customer_phone text,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  table_number_snapshot text,
  order_type public.order_type NOT NULL DEFAULT 'dine-in',
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2) NOT NULL DEFAULT 0.00,
  tax numeric(10,2) NOT NULL DEFAULT 0.00,
  discount numeric(10,2) NOT NULL DEFAULT 0.00,
  total numeric(10,2) NOT NULL DEFAULT 0.00,
  payment_method public.payment_method NOT NULL DEFAULT 'card',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  notes text,
  prep_time_minutes integer DEFAULT 15,
  estimated_ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_id);

-- 3. Order Items (with historical price and options snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  price_snapshot numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  is_veg_snapshot boolean NOT NULL DEFAULT false,
  selected_options_snapshot jsonb DEFAULT '[]'::jsonb,
  special_instructions text,
  item_total numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- 4. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'paid',
  transaction_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant ON public.payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- 5. Customer CRM & Loyalty
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  loyalty_points integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'Bronze',
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric(10,2) NOT NULL DEFAULT 0.00,
  favorite_item text,
  last_visit_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_restaurant ON public.customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(restaurant_id, tier);

