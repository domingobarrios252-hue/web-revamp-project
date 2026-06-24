
ALTER TABLE public.special_pieces
  ADD COLUMN IF NOT EXISTS crops JSONB NOT NULL DEFAULT '{}'::jsonb;
