ALTER TABLE public.result_events
  ADD COLUMN IF NOT EXISTS stream_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stream_status text NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS stream_title text,
  ADD COLUMN IF NOT EXISTS stream_description text,
  ADD COLUMN IF NOT EXISTS stream_embed_url text,
  ADD COLUMN IF NOT EXISTS stream_poster_url text,
  ADD COLUMN IF NOT EXISTS stream_poster_mobile_url text,
  ADD COLUMN IF NOT EXISTS stream_poster_alt text,
  ADD COLUMN IF NOT EXISTS stream_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS stream_cta_label text,
  ADD COLUMN IF NOT EXISTS stream_cta_url text,
  ADD COLUMN IF NOT EXISTS stream_provider text,
  ADD COLUMN IF NOT EXISTS stream_attribution text;
ALTER TABLE public.result_events DROP CONSTRAINT IF EXISTS result_events_stream_status_chk;
ALTER TABLE public.result_events ADD CONSTRAINT result_events_stream_status_chk CHECK (stream_status IN ('upcoming','live','finished'));

ALTER TABLE public.live_timeline ALTER COLUMN event_id DROP NOT NULL;
ALTER TABLE public.live_timeline ADD COLUMN IF NOT EXISTS result_event_id uuid REFERENCES public.result_events(id) ON DELETE RESTRICT;
ALTER TABLE public.live_timeline DROP CONSTRAINT IF EXISTS live_timeline_one_event_chk;
ALTER TABLE public.live_timeline ADD CONSTRAINT live_timeline_one_event_chk CHECK (event_id IS NOT NULL OR result_event_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_live_timeline_result_event ON public.live_timeline(result_event_id, occurred_at DESC);