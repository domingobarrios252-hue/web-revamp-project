ALTER TABLE public.special_editorials
  ADD COLUMN IF NOT EXISTS hero_image_mobile_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_image_alt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_image_mobile_alt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ctas jsonb NOT NULL DEFAULT '[]'::jsonb;