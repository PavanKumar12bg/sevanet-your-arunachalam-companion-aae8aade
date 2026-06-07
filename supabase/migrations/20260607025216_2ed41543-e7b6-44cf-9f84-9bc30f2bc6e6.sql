CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.user_roles
     WHERE user_id = _user_id
       AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.user_roles
     WHERE user_id = _user_id
       AND role IN ('admin','super_admin')
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO anon, authenticated, service_role;

ALTER POLICY "Categories viewable by all" ON public.categories
  USING (is_active OR private.is_admin(auth.uid()));
ALTER POLICY "Admins manage categories" ON public.categories
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));

ALTER POLICY "Public can view published listings" ON public.listings
  USING (status = 'published' OR owner_id = auth.uid() OR private.is_admin(auth.uid()));
ALTER POLICY "Owners can create listings" ON public.listings
  WITH CHECK (owner_id = auth.uid() OR private.is_admin(auth.uid()));
ALTER POLICY "Owners and admins update listings" ON public.listings
  USING (owner_id = auth.uid() OR private.is_admin(auth.uid()));
ALTER POLICY "Admins delete listings" ON public.listings
  USING (private.is_admin(auth.uid()) OR owner_id = auth.uid());

ALTER POLICY "Listing owner or admin manages images" ON public.listing_images
  USING (EXISTS (
    SELECT 1 FROM public.listings l
     WHERE l.id = listing_images.listing_id
       AND (l.owner_id = auth.uid() OR private.is_admin(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.listings l
     WHERE l.id = listing_images.listing_id
       AND (l.owner_id = auth.uid() OR private.is_admin(auth.uid()))
  ));

ALTER POLICY "Public sees approved reviews" ON public.reviews
  USING (status = 'approved' OR user_id = auth.uid() OR private.is_admin(auth.uid()));
ALTER POLICY "Users update own reviews; admins all" ON public.reviews
  USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
ALTER POLICY "Users delete own reviews; admins all" ON public.reviews
  USING (user_id = auth.uid() OR private.is_admin(auth.uid()));

ALTER POLICY "Review owner manages images" ON public.review_images
  USING (EXISTS (
    SELECT 1 FROM public.reviews r
     WHERE r.id = review_images.review_id
       AND (r.user_id = auth.uid() OR private.is_admin(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reviews r
     WHERE r.id = review_images.review_id
       AND (r.user_id = auth.uid() OR private.is_admin(auth.uid()))
  ));

ALTER POLICY "Users see own application" ON public.business_owners
  USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
ALTER POLICY "Admins update applications" ON public.business_owners
  USING (private.is_admin(auth.uid()) OR user_id = auth.uid());
ALTER POLICY "Admins delete applications" ON public.business_owners
  USING (private.is_admin(auth.uid()));

ALTER POLICY "Admins manage SEO" ON public.seo_settings
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));
ALTER POLICY "Admins manage audio" ON public.audio_settings
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));

ALTER POLICY "Admins view all roles" ON public.user_roles
  USING (private.is_admin(auth.uid()));
ALTER POLICY "Admins insert roles" ON public.user_roles
  WITH CHECK (private.is_admin(auth.uid()));
ALTER POLICY "Admins update roles" ON public.user_roles
  USING (private.is_admin(auth.uid()));
ALTER POLICY "Admins delete roles" ON public.user_roles
  USING (private.is_admin(auth.uid()));

ALTER POLICY "Admins manage all storage" ON storage.objects
  USING (private.is_admin(auth.uid()))
  WITH CHECK (private.is_admin(auth.uid()));

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;