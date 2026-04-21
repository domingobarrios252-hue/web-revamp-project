ALTER TABLE public.skaters ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_skaters_featured ON public.skaters (featured) WHERE featured = true;