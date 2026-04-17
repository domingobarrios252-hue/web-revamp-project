-- ============ REGIONS (CCAA + Países) ============
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'Nacional', -- 'Nacional' | 'Internacional'
  flag_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regions viewable by everyone" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admins can insert regions" ON public.regions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update regions" ON public.regions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete regions" ON public.regions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CLUBS ============
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs viewable by everyone" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Admins/editors can insert clubs" ON public.clubs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can update clubs" ON public.clubs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete clubs" ON public.clubs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SKATERS ============
CREATE TABLE public.skaters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  birth_year INTEGER,
  category TEXT, -- Senior, Junior, Cadete, Infantil, etc.
  gender TEXT, -- M, F
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  total_points NUMERIC NOT NULL DEFAULT 0,
  personal_records JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"event":"300m CR","time":"24.512","date":"2025-06-15","place":"Valladolid"}]
  bio TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skaters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skaters viewable by everyone" ON public.skaters FOR SELECT USING (true);
CREATE POLICY "Admins/editors can insert skaters" ON public.skaters FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can update skaters" ON public.skaters FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete skaters" ON public.skaters FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_skaters_updated_at BEFORE UPDATE ON public.skaters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_skaters_club ON public.skaters(club_id);
CREATE INDEX idx_skaters_region ON public.skaters(region_id);
CREATE INDEX idx_skaters_points ON public.skaters(total_points DESC);

-- ============ COMPETITIONS ============
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  scope TEXT NOT NULL DEFAULT 'Nacional', -- Nacional | Autonómico | Internacional
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competitions viewable by everyone" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Admins/editors can insert competitions" ON public.competitions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can update competitions" ON public.competitions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete competitions" ON public.competitions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMPETITION RESULTS ============
CREATE TABLE public.competition_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skater_id UUID NOT NULL REFERENCES public.skaters(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, -- "300m Contrarreloj", "500m+D", "10000m Puntos+Eliminación"
  category TEXT, -- Senior F, Junior M...
  position INTEGER,
  points NUMERIC NOT NULL DEFAULT 0,
  result_time TEXT, -- "24.512" o tiempo final
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Results viewable by everyone" ON public.competition_results FOR SELECT USING (true);
CREATE POLICY "Admins/editors can insert results" ON public.competition_results FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can update results" ON public.competition_results FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete results" ON public.competition_results FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_competition_results_updated_at BEFORE UPDATE ON public.competition_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_results_skater ON public.competition_results(skater_id);
CREATE INDEX idx_results_competition ON public.competition_results(competition_id);

-- ============ STORAGE BUCKET para fotos de patinadores y logos ============
INSERT INTO storage.buckets (id, name, public) VALUES ('skaters', 'skaters', true);

CREATE POLICY "Skater images publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'skaters');
CREATE POLICY "Admins/editors can upload skater images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'skaters' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);
CREATE POLICY "Admins/editors can update skater images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'skaters' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);
CREATE POLICY "Admins can delete skater images" ON storage.objects FOR DELETE USING (
  bucket_id = 'skaters' AND has_role(auth.uid(), 'admin'::app_role)
);

-- ============ SEED inicial de regiones (CCAA + países iberoamericanos) ============
INSERT INTO public.regions (name, code, scope, sort_order) VALUES
  ('Asturias', 'AST', 'Nacional', 1),
  ('Navarra', 'NAV', 'Nacional', 2),
  ('Comunidad Valenciana', 'VAL', 'Nacional', 3),
  ('Murcia', 'MUR', 'Nacional', 4),
  ('Cataluña', 'CAT', 'Nacional', 5),
  ('Madrid', 'MAD', 'Nacional', 6),
  ('Andalucía', 'AND', 'Nacional', 7),
  ('Galicia', 'GAL', 'Nacional', 8),
  ('Castilla y León', 'CYL', 'Nacional', 9),
  ('País Vasco', 'PVA', 'Nacional', 10),
  ('Colombia', 'COL', 'Internacional', 20),
  ('Ecuador', 'ECU', 'Internacional', 21),
  ('Venezuela', 'VEN', 'Internacional', 22);