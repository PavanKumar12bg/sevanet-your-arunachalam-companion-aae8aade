CREATE TABLE IF NOT EXISTS public.girivalam_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  distance_m NUMERIC NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.girivalam_progress TO authenticated;
GRANT ALL ON public.girivalam_progress TO service_role;

ALTER TABLE public.girivalam_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own girivalam progress"
  ON public.girivalam_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_girivalam_progress_updated_at
  BEFORE UPDATE ON public.girivalam_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();