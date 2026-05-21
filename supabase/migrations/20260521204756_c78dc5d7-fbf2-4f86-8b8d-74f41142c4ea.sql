
-- 1) Home modules: control which modules appear in the home dynamic zone
CREATE TABLE IF NOT EXISTS public.home_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home modules viewable by everyone"
  ON public.home_modules FOR SELECT USING (true);
CREATE POLICY "Admins manage home modules insert"
  ON public.home_modules FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage home modules update"
  ON public.home_modules FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage home modules delete"
  ON public.home_modules FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_home_modules_updated_at
  BEFORE UPDATE ON public.home_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.home_modules;

INSERT INTO public.home_modules (key, value)
VALUES ('dynamic_zone_mode', 'liga')
ON CONFLICT (key) DO NOTHING;

-- 2) Extend home_standings_groups with editorial fields
ALTER TABLE public.home_standings_groups
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS autoplay boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_cards integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS full_url text;

-- 3) Extend home_standings_rows with link
ALTER TABLE public.home_standings_rows
  ADD COLUMN IF NOT EXISTS full_url text;

-- 4) Extend events with Live Event Center fields
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS season text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS show_in_home boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_center_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_calendar boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_results boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS streaming_url text;

-- 5) Trigger: only one featured live event at a time
CREATE OR REPLACE FUNCTION public.enforce_single_live_featured_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_featured = true AND NEW.live_center_enabled = true THEN
    UPDATE public.events
       SET is_featured = false, live_center_enabled = false
     WHERE id <> NEW.id
       AND is_featured = true
       AND live_center_enabled = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_live_featured_event ON public.events;
CREATE TRIGGER trg_single_live_featured_event
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_live_featured_event();

-- 6) Extend races (event tests) with editorial fields
ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
