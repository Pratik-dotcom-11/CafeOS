-- ============================================================================
-- CAFÉOS DATABASE ARCHITECTURE - MIGRATION 09: SECURITY DEFINER RPC HARDENING
-- ============================================================================

-- 1. Revoke execute on internal trigger functions from public, anon, and authenticated
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2. Revoke execute on helper functions from public and anon so they cannot be invoked via /rest/v1/rpc/ by unauthenticated callers
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_user_restaurant_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_restaurant_role(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.is_restaurant_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_member(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.is_restaurant_manager_or_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_restaurant_manager_or_owner(uuid) FROM anon;

-- Grant execution to authenticated users and postgres for internal RLS checks
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, postgres;
GRANT EXECUTE ON FUNCTION public.get_user_restaurant_role(uuid) TO authenticated, postgres;
GRANT EXECUTE ON FUNCTION public.is_restaurant_member(uuid) TO authenticated, postgres;
GRANT EXECUTE ON FUNCTION public.is_restaurant_manager_or_owner(uuid) TO authenticated, postgres;

