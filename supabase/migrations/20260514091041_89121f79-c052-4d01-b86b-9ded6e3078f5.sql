ALTER TABLE public.schedule_items ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';
CREATE INDEX IF NOT EXISTS idx_schedule_items_country ON public.schedule_items(country_code);