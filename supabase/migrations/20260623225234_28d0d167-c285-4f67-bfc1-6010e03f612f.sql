ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS image_crops jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_display_mode text NOT NULL DEFAULT 'crop';

ALTER TABLE public.news
  DROP CONSTRAINT IF EXISTS news_hero_display_mode_check;
ALTER TABLE public.news
  ADD CONSTRAINT news_hero_display_mode_check
  CHECK (hero_display_mode IN ('crop','full'));