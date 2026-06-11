
-- 1. Fix profiles_public view: use security_invoker so caller's RLS applies
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT id, full_name, preferred_language, created_at FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2. Restrict user_roles write policies to authenticated only
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND user_id <> auth.uid());
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()) AND user_id <> auth.uid());

-- 3. safety_contacts
CREATE TABLE IF NOT EXISTS public.safety_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  description text,
  address text,
  pincode text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.safety_contacts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.safety_contacts TO authenticated;
GRANT ALL ON public.safety_contacts TO service_role;

ALTER TABLE public.safety_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active safety contacts" ON public.safety_contacts
  FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins insert safety contacts" ON public.safety_contacts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update safety contacts" ON public.safety_contacts
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete safety contacts" ON public.safety_contacts
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER safety_contacts_set_updated
  BEFORE UPDATE ON public.safety_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins insert announcements" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update announcements" ON public.announcements
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete announcements" ON public.announcements
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER announcements_set_updated
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed safety contacts
INSERT INTO public.safety_contacts (category, name, phone, description, sort_order) VALUES
  ('Emergency Helplines', 'State Control Room', '1070', 'Tamil Nadu state emergency control room', 10),
  ('Emergency Helplines', 'Collectorate Board', '04175-232260', 'Tiruvannamalai Collectorate', 20),
  ('Emergency Helplines', 'Police Control Room', '100', 'All India police emergency', 30),
  ('Emergency Helplines', 'Accident Helpline', '108', 'Medical/accident emergency', 40),
  ('Emergency Helplines', 'Fire & Rescue', '101', 'Fire and rescue services', 50),
  ('Emergency Helplines', 'Ambulance Helpline', '102', 'Ambulance service', 60),
  ('Emergency Helplines', 'Child Helpline', '1098', 'Child protection helpline', 70),
  ('Emergency Helplines', 'Disaster Helpline', '1077', 'Disaster management', 80),
  ('Emergency Helplines', 'Women / Sexual Harassment Helpline', '1091', 'Women safety and harassment', 90),
  ('Emergency Helplines', 'BSNL Helpline', '1500', 'BSNL customer service', 100),
  ('Emergency Helplines', 'EB Complaints', '1912', 'Electricity board complaints', 110);

INSERT INTO public.safety_contacts (category, name, phone, description, address, pincode, sort_order) VALUES
  ('Police Stations', 'Tiruvannamalai Town Police Station', '04175-222302', 'Tiruvannamalai Town Sub Division', 'Tiruvannamalai', '606601', 200),
  ('Police Stations', 'Tiruvannamalai Town Crime Police Station', '04175-222303', 'Tiruvannamalai Town Sub Division', 'Tiruvannamalai', '606601', 210),
  ('Police Stations', 'Tiruvannamalai East Police Station', '04175-250444', 'Tiruvannamalai Town Sub Division', 'Tiruvannamalai', '606601', 220),
  ('Police Stations', 'Tiruvannamalai Taluk Police Station', '04175-232274', 'Tiruvannamalai Town Sub Division', 'Tiruvannamalai', '606601', 230);

INSERT INTO public.safety_contacts (category, name, phone, description, address, pincode, is_featured, sort_order) VALUES
  ('SP Office', 'Dr. M. Sudhakar IPS', '04175-233431', 'Superintendent of Police', 'Vengikkal, Tiruvannamalai', '606604', true, 300);

-- 6. Seed default announcement
INSERT INTO public.announcements (message, sort_order) VALUES
  ('🔔 Girivalam pilgrims are advised to use designated walking paths.', 10);
