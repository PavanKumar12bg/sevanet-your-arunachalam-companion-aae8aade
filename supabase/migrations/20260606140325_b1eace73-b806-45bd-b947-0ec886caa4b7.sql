
-- Admin policies for user_roles management
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE USING (public.is_admin(auth.uid()));

-- Allow admins to delete business_owners apps
CREATE POLICY "Admins delete applications" ON public.business_owners FOR DELETE USING (public.is_admin(auth.uid()));

-- Allow admins to read/write storage objects across buckets
CREATE POLICY "Admins manage all storage" ON storage.objects FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Trigger to promote user to business_owner when their application is approved
CREATE OR REPLACE FUNCTION public.promote_business_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'business_owner')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS business_owners_promote ON public.business_owners;
CREATE TRIGGER business_owners_promote AFTER INSERT OR UPDATE ON public.business_owners
  FOR EACH ROW EXECUTE FUNCTION public.promote_business_owner();
