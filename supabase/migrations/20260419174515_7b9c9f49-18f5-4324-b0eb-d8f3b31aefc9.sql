-- Drop old ranking system
DROP TABLE IF EXISTS public.competition_results CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;

-- Enums for MVP awards
DO $$ BEGIN
  CREATE TYPE public.mvp_tier AS ENUM ('elite', 'estrella', 'promesa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.mvp_gender AS ENUM ('masculino', 'femenino');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Seasons table (years)
CREATE TABLE IF NOT EXISTS public.mvp_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  label text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mvp_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasons viewable by everyone" ON public.mvp_seasons FOR SELECT USING (true);
CREATE POLICY "Admins/editors can insert seasons" ON public.mvp_seasons FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can update seasons" ON public.mvp_seasons FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete seasons" ON public.mvp_seasons FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_mvp_seasons_updated BEFORE UPDATE ON public.mvp_seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MVP Awards table (independent entries)
CREATE TABLE IF NOT EXISTS public.mvp_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.mvp_seasons(id) ON DELETE CASCADE,
  tier public.mvp_tier NOT NULL,
  gender public.mvp_gender NOT NULL,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 3),
  full_name text NOT NULL,
  photo_url text,
  club text,
  region text,
  category_age text,
  merit text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, tier, gender, position)
);

CREATE INDEX idx_mvp_awards_lookup ON public.mvp_awards (season_id, tier, gender, position);

ALTER TABLE public.mvp_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published awards viewable by everyone" ON public.mvp_awards FOR SELECT USING (published = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can insert awards" ON public.mvp_awards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins/editors can update awards" ON public.mvp_awards FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Admins can delete awards" ON public.mvp_awards FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_mvp_awards_updated BEFORE UPDATE ON public.mvp_awards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one current season
CREATE OR REPLACE FUNCTION public.enforce_single_current_season()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE public.mvp_seasons SET is_current = false WHERE id <> NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mvp_seasons_single_current
AFTER INSERT OR UPDATE OF is_current ON public.mvp_seasons
FOR EACH ROW WHEN (NEW.is_current = true)
EXECUTE FUNCTION public.enforce_single_current_season();

-- Seed current season
INSERT INTO public.mvp_seasons (year, label, is_current) VALUES (2025, 'Temporada 2025', true)
ON CONFLICT (year) DO NOTHING;