ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS round text,
  ADD COLUMN IF NOT EXISTS federation text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS home_sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_live_results_event_filters
  ON public.live_results (event_slug, race, category, gender, round);

CREATE INDEX IF NOT EXISTS idx_live_results_home_slider
  ON public.live_results (featured_in_live_center, home_sort_order)
  WHERE featured_in_live_center = true;