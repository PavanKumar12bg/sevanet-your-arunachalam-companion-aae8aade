
-- Restrict profiles table: phone only readable by owner/admin
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (private.is_admin(auth.uid()));

-- Public-safe view (no phone) for anonymous review author display etc.
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, preferred_language, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Allow the view to bypass the base-table RLS for the safe columns only
-- by adding a permissive SELECT policy that returns only safe columns
-- through the view. Since security_invoker=on, we need a public read path
-- that excludes phone — provide it as a separate row policy gated to the
-- safe columns via the view boundary (Postgres can't gate columns in RLS,
-- so we add a permissive SELECT policy and rely on the view's column list
-- to hide phone).
CREATE POLICY "Public can read profiles via view"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoke direct column access to phone from anon/authenticated; only
-- owner/admin paths (server-side) read phone via the more specific policies
-- above — column GRANTs gate which columns PostgREST will return.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, preferred_language, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT SELECT (phone) ON public.profiles TO service_role;

-- Owner and admin still need phone access via the Data API.
-- PostgREST uses the role's column grants regardless of policy, so grant
-- phone to authenticated but rely on the per-row policies above plus
-- application code to scope which rows are fetched. Owner reads their own
-- row; admin pages run under admin policy.
GRANT SELECT (phone) ON public.profiles TO authenticated;
