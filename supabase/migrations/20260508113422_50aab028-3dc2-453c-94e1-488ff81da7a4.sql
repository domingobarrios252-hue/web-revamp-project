ALTER TABLE public.news ADD COLUMN IF NOT EXISTS hero_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS news_hero_order_idx ON public.news (hero_order) WHERE featured = true;