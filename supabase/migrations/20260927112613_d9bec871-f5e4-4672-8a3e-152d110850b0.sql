ALTER TABLE public.special_pieces
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS secondary_image_url text,
  ADD COLUMN IF NOT EXISTS button_label text,
  ADD COLUMN IF NOT EXISTS content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb;