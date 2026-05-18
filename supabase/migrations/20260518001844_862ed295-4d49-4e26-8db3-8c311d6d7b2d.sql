-- 1. Enable RLS on app_config (default deny; server uses service role which bypasses)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on blog_posts (default deny; server uses service role which bypasses)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 3. Fix user_roles privilege escalation: drop self-referential admin policies.
-- Only the backend (service role) should mutate role assignments.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- 4. Lock down SECURITY DEFINER functions that should only be called server-side.
REVOKE EXECUTE ON FUNCTION public.consume_quota(uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_usage(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
-- has_role is intentionally callable by authenticated users (used by client to check own role).
