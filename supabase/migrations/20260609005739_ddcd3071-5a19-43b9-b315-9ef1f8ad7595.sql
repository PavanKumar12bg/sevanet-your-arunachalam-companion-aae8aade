
-- Remove the overly permissive policy reintroduced for the view
DROP POLICY IF EXISTS "Public can read profiles via view" ON public.profiles;

-- Make the view bypass RLS but only expose safe columns
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT id, full_name, preferred_language, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Phone column: only owner (via own-row RLS) and service_role should read it.
REVOKE SELECT (phone) ON public.profiles FROM authenticated;
GRANT SELECT (phone) ON public.profiles TO authenticated;
-- Note: owner-only access is enforced by the row policies on profiles
-- ("Users can read own profile" + "Admins can read all profiles").
