-- 20261110000012_menu_rls_and_storage_permissions.sql
-- Grant execute permissions to anon and authenticated for public menu RLS functions

GRANT EXECUTE ON FUNCTION public.is_restaurant_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_restaurant_manager_or_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

