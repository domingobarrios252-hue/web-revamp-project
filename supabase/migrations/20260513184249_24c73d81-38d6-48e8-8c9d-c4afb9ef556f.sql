
-- 1. Countries catalog
CREATE TABLE IF NOT EXISTS public.countries (
  code text PRIMARY KEY,
  name text NOT NULL,
  flag_url text,
  accent_color_1 text,
  accent_color_2 text,
  accent_color_3 text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Countries viewable by everyone" ON public.countries;
DROP POLICY IF EXISTS "Admins can insert countries" ON public.countries;
DROP POLICY IF EXISTS "Admins can update countries" ON public.countries;
DROP POLICY IF EXISTS "Admins can delete countries" ON public.countries;

CREATE POLICY "Countries viewable by everyone" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Admins can insert countries" ON public.countries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update countries" ON public.countries FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete countries" ON public.countries FOR DELETE USING (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_countries_updated_at ON public.countries;
CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.countries (code, name, accent_color_1, accent_color_2, accent_color_3, active, sort_order) VALUES
  ('es', 'España',     '#AA151B', '#F1BF00', '#AA151B', true,  1),
  ('co', 'Colombia',   '#FCD116', '#003893', '#CE1126', true,  2),
  ('ve', 'Venezuela',  '#FCD116', '#00247D', '#CF142B', true,  3),
  ('mx', 'México',     '#006847', '#FFFFFF', '#CE1126', false, 4),
  ('ar', 'Argentina',  '#74ACDF', '#FFFFFF', '#FCBF49', false, 5),
  ('cl', 'Chile',      '#0039A6', '#FFFFFF', '#D52B1E', false, 6),
  ('ec', 'Ecuador',    '#FFD100', '#0072CE', '#EF3340', false, 7),
  ('pe', 'Perú',       '#D91023', '#FFFFFF', '#D91023', false, 8)
ON CONFLICT (code) DO NOTHING;

-- 2. Editor → countries
CREATE TABLE IF NOT EXISTS public.editor_countries (
  user_id uuid NOT NULL,
  country_code text NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, country_code)
);

ALTER TABLE public.editor_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own country assignments" ON public.editor_countries;
DROP POLICY IF EXISTS "Admins manage editor countries" ON public.editor_countries;

CREATE POLICY "View own country assignments" ON public.editor_countries
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage editor countries" ON public.editor_countries
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Helper
CREATE OR REPLACE FUNCTION public.can_edit_country(_user_id uuid, _country text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.editor_countries WHERE user_id = _user_id AND country_code = _country);
$$;

-- 4. country_code columns
ALTER TABLE public.news            ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.events          ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.interviews      ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.skaters         ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.clubs           ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.tv_broadcasts   ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.tv_highlights   ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.sponsors        ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
ALTER TABLE public.medal_standings ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';

CREATE INDEX IF NOT EXISTS idx_news_country_code            ON public.news(country_code);
CREATE INDEX IF NOT EXISTS idx_events_country_code          ON public.events(country_code);
CREATE INDEX IF NOT EXISTS idx_interviews_country_code      ON public.interviews(country_code);
CREATE INDEX IF NOT EXISTS idx_skaters_country_code         ON public.skaters(country_code);
CREATE INDEX IF NOT EXISTS idx_clubs_country_code           ON public.clubs(country_code);
CREATE INDEX IF NOT EXISTS idx_tv_broadcasts_country_code   ON public.tv_broadcasts(country_code);
CREATE INDEX IF NOT EXISTS idx_tv_highlights_country_code   ON public.tv_highlights(country_code);
CREATE INDEX IF NOT EXISTS idx_sponsors_country_code        ON public.sponsors(country_code);
CREATE INDEX IF NOT EXISTS idx_medal_standings_country_code ON public.medal_standings(country_code);

-- 5. Visibility table
DO $$ BEGIN
  CREATE TYPE public.visibility_channel AS ENUM ('global_home', 'featured', 'breaking', 'country');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.news_visibility (
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  channel public.visibility_channel NOT NULL,
  country_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (news_id, channel, country_code),
  CONSTRAINT news_visibility_country_consistency CHECK (
    (channel = 'country' AND country_code <> '')
    OR (channel <> 'country' AND country_code = '')
  )
);

CREATE INDEX IF NOT EXISTS idx_news_visibility_channel_country ON public.news_visibility(channel, country_code);

ALTER TABLE public.news_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "News visibility viewable by everyone" ON public.news_visibility;
DROP POLICY IF EXISTS "Admins manage all news visibility" ON public.news_visibility;
DROP POLICY IF EXISTS "Editors manage visibility of their country news" ON public.news_visibility;

CREATE POLICY "News visibility viewable by everyone" ON public.news_visibility FOR SELECT USING (true);

CREATE POLICY "Admins manage all news visibility" ON public.news_visibility
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors manage visibility of their country news" ON public.news_visibility
  FOR ALL
  USING (
    (has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'colaborador'))
    AND EXISTS (
      SELECT 1 FROM public.news n
      WHERE n.id = news_visibility.news_id
        AND public.can_edit_country(auth.uid(), n.country_code)
    )
  )
  WITH CHECK (
    (has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'colaborador'))
    AND EXISTS (
      SELECT 1 FROM public.news n
      WHERE n.id = news_visibility.news_id
        AND public.can_edit_country(auth.uid(), n.country_code)
    )
    AND (
      news_visibility.channel <> 'country'
      OR public.can_edit_country(auth.uid(), news_visibility.country_code)
    )
  );

-- 6. Backfill
INSERT INTO public.news_visibility (news_id, channel, country_code)
SELECT id, 'global_home'::public.visibility_channel, '' FROM public.news
ON CONFLICT DO NOTHING;

INSERT INTO public.news_visibility (news_id, channel, country_code)
SELECT id, 'country'::public.visibility_channel, 'es' FROM public.news
ON CONFLICT DO NOTHING;

INSERT INTO public.news_visibility (news_id, channel, country_code)
SELECT id, 'featured'::public.visibility_channel, '' FROM public.news WHERE featured = true
ON CONFLICT DO NOTHING;
