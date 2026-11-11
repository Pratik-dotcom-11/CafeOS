-- 20261110000002_menu_schema.sql
-- CafeOS Menu Schema: Categories, Products, Variants, Customization Addons

-- 1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  icon text NOT NULL DEFAULT '🍽️',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_category_restaurant_slug UNIQUE (restaurant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(restaurant_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(restaurant_id, sort_order);

-- 2. Products (Dishes, Drinks, Pastries)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  original_price numeric(10,2),
  image_url text,
  is_veg boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  is_bestseller boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 5.0,
  review_count integer NOT NULL DEFAULT 0,
  prep_time_minutes integer NOT NULL DEFAULT 15,
  calories integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_restaurant_slug UNIQUE (restaurant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(restaurant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(restaurant_id, is_bestseller);

-- 3. Product Variants (Sizes, Portions)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_adjustment numeric(10,2) NOT NULL DEFAULT 0.00,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

-- 4. Product Add-ons / Customization Groups & Options
CREATE TABLE IF NOT EXISTS public.product_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_title text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  max_select integer NOT NULL DEFAULT 1,
  option_name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_addons_product ON public.product_addons(product_id);

