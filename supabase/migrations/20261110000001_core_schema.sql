-- 20261110000001_core_schema.sql
-- CafeOS Core Schema: Extensions, Helpers, Profiles, Restaurants, Members, Subscription Plans

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Generic timestamp updater function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Profiles (mirroring auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Restaurants (Tenant root)
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  cuisine text,
  rating numeric(3,2) NOT NULL DEFAULT 5.0,
  address text,
  city text,
  contact_email text,
  contact_phone text,
  opening_hours text DEFAULT 'Mon - Sun: 7:00 AM - 10:00 PM',
  currency text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  tax_percentage numeric(5,2) NOT NULL DEFAULT 8.5,
  delivery_available boolean NOT NULL DEFAULT true,
  takeaway_available boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_is_active ON public.restaurants(is_active);

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Restaurant Members & Roles
DO $$ BEGIN
  CREATE TYPE public.restaurant_role AS ENUM ('owner', 'manager', 'cashier', 'kitchen', 'server');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM ('active', 'invited', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE public.restaurant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.restaurant_role NOT NULL DEFAULT 'server',
  status public.member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_member UNIQUE (restaurant_id, user_id)
);

CREATE INDEX idx_restaurant_members_user ON public.restaurant_members(user_id);
CREATE INDEX idx_restaurant_members_restaurant ON public.restaurant_members(restaurant_id);
CREATE INDEX idx_restaurant_members_role ON public.restaurant_members(restaurant_id, role);

CREATE TRIGGER update_restaurant_members_updated_at
  BEFORE UPDATE ON public.restaurant_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Subscription Plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0.00,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0.00,
  max_terminals integer NOT NULL DEFAULT 1,
  max_orders_per_month integer NOT NULL DEFAULT 1000,
  has_kds boolean NOT NULL DEFAULT false,
  has_inventory boolean NOT NULL DEFAULT false,
  has_analytics boolean NOT NULL DEFAULT true,
  has_loyalty boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Subscriptions
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_subscription UNIQUE (restaurant_id)
);

CREATE INDEX idx_subscriptions_restaurant ON public.subscriptions(restaurant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

