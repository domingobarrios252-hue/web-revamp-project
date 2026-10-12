ALTER TYPE public.schedule_status ADD VALUE IF NOT EXISTS 'suspendida';
ALTER TABLE public.schedule_items
  ADD COLUMN IF NOT EXISTS pending_scheduled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS reschedule_note text NULL,
  ADD COLUMN IF NOT EXISTS original_scheduled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz NULL;