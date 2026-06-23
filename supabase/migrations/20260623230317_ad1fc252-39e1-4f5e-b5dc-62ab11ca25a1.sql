ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS cover_crops jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_display_mode text NOT NULL DEFAULT 'crop';

ALTER TABLE public.interviews
  DROP CONSTRAINT IF EXISTS interviews_cover_display_mode_check;
ALTER TABLE public.interviews
  ADD CONSTRAINT interviews_cover_display_mode_check
  CHECK (cover_display_mode IN ('crop','full'));