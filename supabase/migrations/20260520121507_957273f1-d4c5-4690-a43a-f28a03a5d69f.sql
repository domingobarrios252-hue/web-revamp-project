
-- =============================================
-- Fase 2B-1: CLUBES — ampliación + tablas N:N
-- =============================================

-- 1. Ampliar tabla clubs
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS history text,
  ADD COLUMN IF NOT EXISTS school_type text NOT NULL DEFAULT 'mixto',
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coaches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS founded_year integer;

-- Constraint school_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_school_type_check') THEN
    ALTER TABLE public.clubs
      ADD CONSTRAINT clubs_school_type_check
      CHECK (school_type IN ('escuela','competicion','mixto'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clubs_country_code ON public.clubs(country_code);
CREATE INDEX IF NOT EXISTS idx_clubs_published ON public.clubs(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_clubs_region ON public.clubs(region_id);

-- Actualizar policy SELECT para respetar published
DROP POLICY IF EXISTS "Clubs viewable by everyone" ON public.clubs;
CREATE POLICY "Clubs viewable by everyone"
  ON public.clubs FOR SELECT
  USING (published = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- 2. Tabla N:N news_clubs
CREATE TABLE IF NOT EXISTS public.news_clubs (
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (news_id, club_id)
);
CREATE INDEX IF NOT EXISTS idx_news_clubs_club ON public.news_clubs(club_id);
ALTER TABLE public.news_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_clubs viewable by everyone"
  ON public.news_clubs FOR SELECT USING (true);
CREATE POLICY "news_clubs insert admin/editor"
  ON public.news_clubs FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "news_clubs delete admin/editor"
  ON public.news_clubs FOR DELETE
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- 3. Tabla N:N event_clubs
CREATE TABLE IF NOT EXISTS public.event_clubs (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'participante',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, club_id)
);
CREATE INDEX IF NOT EXISTS idx_event_clubs_club ON public.event_clubs(club_id);
ALTER TABLE public.event_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_clubs viewable by everyone"
  ON public.event_clubs FOR SELECT USING (true);
CREATE POLICY "event_clubs insert admin/editor"
  ON public.event_clubs FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "event_clubs delete admin/editor"
  ON public.event_clubs FOR DELETE
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- 4. Seed demo realista (10 clubes españoles)
-- Sólo se inserta si no existen. Region id buscamos por code si existe.
INSERT INTO public.clubs (name, slug, country_code, city, province, school_type, categories, description, featured, published)
VALUES
  ('CPV Reus Deportiu', 'cpv-reus-deportiu', 'es', 'Reus', 'Tarragona', 'mixto',
    ARRAY['Infantil','Juvenil','Junior','Senior'],
    'Club de Patinaje de Velocidad histórico de Cataluña, referente nacional con múltiples títulos.', true, true),
  ('CP Vall d''Hebron', 'cp-vall-hebron', 'es', 'Barcelona', 'Barcelona', 'competicion',
    ARRAY['Junior','Senior'],
    'Sección de patinaje de velocidad del histórico club barcelonés.', true, true),
  ('Club Patín Pelayo', 'club-patin-pelayo', 'es', 'Oviedo', 'Asturias', 'mixto',
    ARRAY['Iniciación','Infantil','Juvenil','Junior','Senior'],
    'Club asturiano con fuerte cantera y presencia en pruebas nacionales.', true, true),
  ('CP Voltregà', 'cp-voltrega', 'es', 'Sant Hipòlit de Voltregà', 'Barcelona', 'competicion',
    ARRAY['Junior','Senior','Máster'],
    'Veterano club catalán especializado en velocidad.', false, true),
  ('CP Lalín', 'cp-lalin', 'es', 'Lalín', 'Pontevedra', 'mixto',
    ARRAY['Infantil','Juvenil','Junior'],
    'Club gallego en crecimiento con escuela base sólida.', false, true),
  ('CP Alcobendas', 'cp-alcobendas', 'es', 'Alcobendas', 'Madrid', 'mixto',
    ARRAY['Iniciación','Infantil','Juvenil','Senior'],
    'Club madrileño con amplia escuela de iniciación.', false, true),
  ('CP Olot', 'cp-olot', 'es', 'Olot', 'Girona', 'mixto',
    ARRAY['Infantil','Juvenil','Junior','Senior'],
    'Club catalán de referencia en La Garrotxa.', false, true),
  ('CP Arteixo', 'cp-arteixo', 'es', 'Arteixo', 'A Coruña', 'mixto',
    ARRAY['Iniciación','Infantil','Juvenil','Senior'],
    'Club gallego con destacada participación en pruebas FEP.', false, true),
  ('CP El Vendrell', 'cp-el-vendrell', 'es', 'El Vendrell', 'Tarragona', 'competicion',
    ARRAY['Junior','Senior'],
    'Club tarraconense orientado a competición de alto nivel.', false, true),
  ('CP Astillero', 'cp-astillero', 'es', 'Astillero', 'Cantabria', 'mixto',
    ARRAY['Infantil','Juvenil','Junior'],
    'Club cántabro con creciente proyección nacional.', false, true)
ON CONFLICT (slug) DO NOTHING;
