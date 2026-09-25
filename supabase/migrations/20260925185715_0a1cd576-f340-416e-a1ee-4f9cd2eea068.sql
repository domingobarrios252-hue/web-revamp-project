ALTER TABLE public.result_events
  ADD COLUMN IF NOT EXISTS results_provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_event_ref text,
  ADD COLUMN IF NOT EXISTS provider_attribution text,
  ADD COLUMN IF NOT EXISTS provider_attribution_visible boolean NOT NULL DEFAULT false;
ALTER TABLE public.result_events DROP CONSTRAINT IF EXISTS result_events_results_provider_chk;
ALTER TABLE public.result_events ADD CONSTRAINT result_events_results_provider_chk
  CHECK (results_provider IN ('manual','velopro_api','velopro_widget','velopro_embed'));

ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS result_event_id uuid REFERENCES public.result_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS schedule_item_id uuid REFERENCES public.schedule_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS record_mark text;
ALTER TABLE public.live_results DROP CONSTRAINT IF EXISTS live_results_result_status_chk;
ALTER TABLE public.live_results ADD CONSTRAINT live_results_result_status_chk
  CHECK (result_status IS NULL OR result_status IN ('upcoming','in_progress','provisional','official'));
CREATE INDEX IF NOT EXISTS idx_live_results_result_event ON public.live_results(result_event_id);
CREATE INDEX IF NOT EXISTS idx_live_results_schedule_item ON public.live_results(schedule_item_id);