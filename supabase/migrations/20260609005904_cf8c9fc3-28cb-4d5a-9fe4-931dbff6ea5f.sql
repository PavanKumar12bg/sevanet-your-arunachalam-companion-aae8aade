
-- Drop the broad public row policy
DROP POLICY IF EXISTS "Public can read profile rows" ON public.profiles;

-- Restore phone column grant so owner/admin paths work via the data API
GRANT SELECT (phone) ON public.profiles TO authenticated;
-- (row policies "Users can read own profile" + "Admins can read all profiles"
--  already restrict which rows return phone)

-- Recreate profiles_public as a SECURITY DEFINER view that only exposes
-- safe columns; this is the documented pattern for hiding sensitive columns
-- while still allowing public lookups (e.g., review author names).
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT id, full_name, preferred_language, created_at
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Drop the helper function; account page now reads its own row directly.
DROP FUNCTION IF EXISTS public.get_my_phone();
