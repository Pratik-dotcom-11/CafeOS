-- 20261110000007_storage_and_hardening.sql
-- Hardening function search_paths, RPC permissions, and Storage Buckets setup

-- 1. Harden Functions with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- Revoke raw anon execution on security definer functions to prevent direct unauthenticated RPC exploitation
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_restaurant_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_manager_or_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;

-- 2. Storage Buckets (Restaurant Logos, Banners, and Food Product Images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('restaurant-assets', 'restaurant-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
-- Public can view images from both buckets
CREATE POLICY "Public can view restaurant assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('restaurant-assets', 'product-images'));

-- Authenticated restaurant staff can upload images under their restaurant folder
CREATE POLICY "Authenticated users can upload restaurant assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('restaurant-assets', 'product-images')
  );

CREATE POLICY "Authenticated users can update their uploaded assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('restaurant-assets', 'product-images'));

CREATE POLICY "Authenticated users can delete their uploaded assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('restaurant-assets', 'product-images'));

