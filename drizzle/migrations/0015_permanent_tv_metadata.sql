ALTER TABLE public.result_events ADD COLUMN stream_published boolean NOT NULL DEFAULT false, ADD COLUMN stream_ends_at timestamptz, ADD COLUMN stream_archived_at timestamptz;
ALTER TABLE public.tv_settings ADD COLUMN featured_result_event_id uuid REFERENCES public.result_events(id) ON DELETE SET NULL;
ALTER TABLE public.result_events ADD CONSTRAINT stream_dates_valid CHECK (stream_ends_at IS NULL OR stream_scheduled_at IS NULL OR stream_ends_at >= stream_scheduled_at);
COMMENT ON COLUMN public.result_events.stream_published IS 'Independent TV publication; never changes event/results publication.';
COMMENT ON COLUMN public.result_events.stream_archived_at IS 'Retained broadcast archive timestamp; not deletion.';
COMMENT ON COLUMN public.tv_settings.featured_result_event_id IS 'Single featured championship broadcast; reuses result_events streaming.';