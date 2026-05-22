ALTER TABLE public.result_events
  ADD COLUMN IF NOT EXISTS placements text[] NOT NULL DEFAULT ARRAY['home']::text[];

-- Seed existing featured events with home placement
UPDATE public.result_events
SET placements = ARRAY['home']::text[]
WHERE featured_in_live_center = true
  AND (placements IS NULL OR array_length(placements, 1) IS NULL);

CREATE INDEX IF NOT EXISTS idx_result_events_placements ON public.result_events USING GIN (placements);