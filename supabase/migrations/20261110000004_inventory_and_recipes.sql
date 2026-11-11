-- 20261110000004_inventory_and_recipes.sql
-- CafeOS Inventory, Suppliers, Recipes, Recipe Items, and Stock Movements

-- 1. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_restaurant ON public.suppliers(restaurant_id);

-- 2. Ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Produce',
  available_stock numeric(12,2) NOT NULL DEFAULT 0.00,
  min_stock numeric(12,2) NOT NULL DEFAULT 10.00,
  unit text NOT NULL DEFAULT 'kg',
  cost_per_unit numeric(10,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'in-stock',
  last_restocked_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON public.ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_status ON public.ingredients(restaurant_id, status);

-- Trigger function for stock status calculation
CREATE OR REPLACE FUNCTION public.sync_ingredient_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_stock <= 0 THEN
    NEW.status := 'out-of-stock';
  ELSIF NEW.available_stock <= NEW.min_stock THEN
    NEW.status := 'low-stock';
  ELSE
    NEW.status := 'in-stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_ingredient_status ON public.ingredients;
CREATE TRIGGER trigger_sync_ingredient_status
  BEFORE INSERT OR UPDATE OF available_stock, min_stock ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_ingredient_status();

-- 3. Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  yield_servings integer NOT NULL DEFAULT 1,
  prep_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_recipe_product UNIQUE (product_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_restaurant ON public.recipes(restaurant_id);

-- 4. Recipe Items
CREATE TABLE IF NOT EXISTS public.recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  quantity_required numeric(10,3) NOT NULL DEFAULT 1.000,
  unit text NOT NULL DEFAULT 'kg',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON public.recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient ON public.recipe_items(ingredient_id);

-- 5. Stock Movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity numeric(12,2) NOT NULL,
  previous_stock numeric(12,2) NOT NULL,
  new_stock numeric(12,2) NOT NULL,
  reason text,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant ON public.stock_movements(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON public.stock_movements(ingredient_id);

