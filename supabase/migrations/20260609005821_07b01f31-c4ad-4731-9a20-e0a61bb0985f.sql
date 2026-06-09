
-- Replace the security-definer view with a security-invoker one
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = on) AS
SELECT id, full_name, preferred_language, created_at
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Allow public row access so the view can return rows under security_invoker,
-- but column grants prevent phone from being returned to anon/authenticated.
CREATE POLICY "Public can read profile rows"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Lock down phone: only service_role can read it via the data API.
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated, PUBLIC;

-- SECURITY DEFINER helper so an authenticated user can fetch their OWN phone.
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_phone() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;
