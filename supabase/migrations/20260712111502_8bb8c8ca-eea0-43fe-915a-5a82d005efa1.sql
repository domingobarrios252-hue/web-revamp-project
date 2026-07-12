
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS live_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS live_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS live_end_at timestamptz;
