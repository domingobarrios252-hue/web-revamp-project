CREATE TABLE public.hall_of_fame (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  cover_url TEXT,
  country_code TEXT NOT NULL DEFAULT 'es',
  birth_year INTEGER,
  death_year INTEGER,
  induction_year INTEGER,
  specialty TEXT,
  club TEXT,
  nationality TEXT,
  bio TEXT,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  social JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hall_of_fame TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hall_of_fame TO authenticated;
GRANT ALL ON public.hall_of_fame TO service_role;

ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published hall of fame"
  ON public.hall_of_fame FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert hall of fame"
  ON public.hall_of_fame FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hall of fame"
  ON public.hall_of_fame FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hall of fame"
  ON public.hall_of_fame FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hall_of_fame_updated_at
  BEFORE UPDATE ON public.hall_of_fame
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_hall_of_fame_country ON public.hall_of_fame(country_code);
CREATE INDEX idx_hall_of_fame_published ON public.hall_of_fame(published);
CREATE INDEX idx_hall_of_fame_sort ON public.hall_of_fame(sort_order);