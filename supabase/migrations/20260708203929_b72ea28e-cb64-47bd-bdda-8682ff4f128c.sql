
ALTER TABLE public.tv_settings
  ADD COLUMN IF NOT EXISTS live_center_event_slug text,
  ADD COLUMN IF NOT EXISTS show_live_center boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_center_position text NOT NULL DEFAULT 'right' CHECK (live_center_position IN ('right','bottom')),
  ADD COLUMN IF NOT EXISTS show_full_results_button boolean NOT NULL DEFAULT true;
