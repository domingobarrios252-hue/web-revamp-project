-- ============================================
-- LIGA NACIONAL — Hub España (modular por país)
-- ============================================

-- Temporadas
CREATE TABLE public.league_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL DEFAULT 'es',
  name text NOT NULL,
  slug text NOT NULL,
  year_label text,
  is_current boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, slug)
);

ALTER TABLE public.league_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "League seasons viewable by everyone"
  ON public.league_seasons FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins/editors insert league seasons"
  ON public.league_seasons FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins/editors update league seasons"
  ON public.league_seasons FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins delete league seasons"
  ON public.league_seasons FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_league_seasons_updated_at
  BEFORE UPDATE ON public.league_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Jornadas
CREATE TABLE public.league_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.league_seasons(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  name text NOT NULL,
  event_date date,
  city text,
  venue text,
  map_url text,
  poster_url text,
  status public.live_center_status NOT NULL DEFAULT 'upcoming',
  pdf_url text,
  gallery text[] NOT NULL DEFAULT '{}',
  video_url text,
  summary_news_id uuid,
  notes text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_rounds_season ON public.league_rounds(season_id, round_number);

ALTER TABLE public.league_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "League rounds viewable by everyone"
  ON public.league_rounds FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins/editors insert league rounds"
  ON public.league_rounds FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins/editors update league rounds"
  ON public.league_rounds FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins delete league rounds"
  ON public.league_rounds FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_league_rounds_updated_at
  BEFORE UPDATE ON public.league_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clasificaciones
CREATE TABLE public.league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.league_seasons(id) ON DELETE CASCADE,
  category text,
  gender text,
  group_name text,
  position integer NOT NULL DEFAULT 0,
  club text,
  athlete_name text,
  points numeric NOT NULL DEFAULT 0,
  rounds_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  podiums integer NOT NULL DEFAULT 0,
  point_diff numeric,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_standings_season ON public.league_standings(season_id, category, gender, position);

ALTER TABLE public.league_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "League standings viewable by everyone"
  ON public.league_standings FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins/editors insert league standings"
  ON public.league_standings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins/editors update league standings"
  ON public.league_standings FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins delete league standings"
  ON public.league_standings FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_league_standings_updated_at
  BEFORE UPDATE ON public.league_standings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Etiqueta de competición para filtrar noticias sin duplicar
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS competition_tag text;
CREATE INDEX IF NOT EXISTS idx_news_competition_tag ON public.news(country_code, competition_tag) WHERE competition_tag IS NOT NULL;

-- ============================================
-- DATOS DEMO — Temporada 2025/26 España
-- ============================================
WITH s AS (
  INSERT INTO public.league_seasons (country_code, name, slug, year_label, is_current, sort_order)
  VALUES ('es', 'Temporada 2025/26', '2025-26', '2025/26', true, 1)
  RETURNING id
)
INSERT INTO public.league_rounds (season_id, round_number, name, event_date, city, venue, status, sort_order)
SELECT s.id, r.n, r.name, r.dt::date, r.city, r.venue, r.st::public.live_center_status, r.n
FROM s, (VALUES
  (1, 'Jornada 1 — Apertura Valladolid', '2025-10-04', 'Valladolid', 'Pabellón Pisuerga', 'finished'),
  (2, 'Jornada 2 — Trofeo Reus',         '2025-10-25', 'Reus',       'Pista Olímpica Reus', 'finished'),
  (3, 'Jornada 3 — Open Alcobendas',     '2025-11-15', 'Alcobendas', 'CDM Valdelasfuentes', 'finished'),
  (4, 'Jornada 4 — GP A Coruña',         '2025-12-13', 'A Coruña',   'Pista Riazor',        'finished'),
  (5, 'Jornada 5 — Memorial Sevilla',    '2026-01-17', 'Sevilla',    'San Pablo',           'live'),
  (6, 'Jornada 6 — Final Barcelona',     '2026-02-21', 'Barcelona',  'Palau Sant Jordi',    'upcoming')
) AS r(n, name, dt, city, venue, st);

WITH s AS (SELECT id FROM public.league_seasons WHERE slug='2025-26' AND country_code='es' LIMIT 1)
INSERT INTO public.league_standings (season_id, category, gender, position, club, points, rounds_played, wins, podiums, point_diff)
SELECT s.id, 'Senior', 'M', r.pos, r.club, r.pts, r.rp, r.w, r.pod, r.pd
FROM s, (VALUES
  (1, 'CPV Barcelona',        285.0, 5, 3, 4, 0.0),
  (2, 'Patín Reus Deportiu',  262.5, 5, 2, 4, -22.5),
  (3, 'CD Valladolid Roller', 248.0, 5, 1, 3, -37.0),
  (4, 'CP Alcobendas',        221.0, 5, 1, 2, -64.0),
  (5, 'CP A Coruña',          198.5, 5, 0, 2, -86.5),
  (6, 'CP Sevilla Velocidad', 187.0, 5, 0, 2, -98.0),
  (7, 'CP Astur',             165.5, 5, 0, 1, -119.5),
  (8, 'Patín Mallorca',       142.0, 5, 0, 0, -143.0),
  (9, 'CP Zaragoza',          128.0, 5, 0, 0, -157.0),
 (10, 'CP Tenerife',          112.5, 5, 0, 0, -172.5)
) AS r(pos, club, pts, rp, w, pod, pd);

WITH s AS (SELECT id FROM public.league_seasons WHERE slug='2025-26' AND country_code='es' LIMIT 1)
INSERT INTO public.league_standings (season_id, category, gender, position, club, points, rounds_played, wins, podiums, point_diff)
SELECT s.id, 'Senior', 'F', r.pos, r.club, r.pts, r.rp, r.w, r.pod, r.pd
FROM s, (VALUES
  (1, 'CPV Barcelona',        298.0, 5, 4, 5, 0.0),
  (2, 'CP Alcobendas',        265.0, 5, 1, 4, -33.0),
  (3, 'Patín Reus Deportiu',  244.0, 5, 0, 3, -54.0),
  (4, 'CD Valladolid Roller', 218.5, 5, 0, 2, -79.5),
  (5, 'CP Sevilla Velocidad', 197.0, 5, 0, 1, -101.0),
  (6, 'CP A Coruña',          178.0, 5, 0, 1, -120.0),
  (7, 'Patín Mallorca',       155.5, 5, 0, 0, -142.5),
  (8, 'CP Tenerife',          132.0, 5, 0, 0, -166.0)
) AS r(pos, club, pts, rp, w, pod, pd);
