ALTER TYPE public.schedule_status ADD VALUE IF NOT EXISTS 'aplazada';
ALTER TYPE public.schedule_status ADD VALUE IF NOT EXISTS 'cancelada';
ALTER TABLE public.schedule_items
  ADD COLUMN IF NOT EXISTS result_event_id uuid REFERENCES public.result_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discipline text,
  ADD COLUMN IF NOT EXISTS event_name_en text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS venue_type text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_schedule_items_result_event ON public.schedule_items(result_event_id, scheduled_at);
ALTER TABLE public.special_editorials
  ADD COLUMN IF NOT EXISTS schedule_notice text DEFAULT 'CALENDARIO PROVISIONAL · SUJETO A MODIFICACIONES DE LA ORGANIZACIÓN',
  ADD COLUMN IF NOT EXISTS schedule_notice_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS today_override date;