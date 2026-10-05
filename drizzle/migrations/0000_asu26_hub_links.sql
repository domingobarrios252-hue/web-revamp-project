ALTER TABLE public.news ADD COLUMN IF NOT EXISTS special_slug text NULL;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS content_kind text NULL;
ALTER TABLE public.news DROP CONSTRAINT IF EXISTS news_content_kind_check;
ALTER TABLE public.news ADD CONSTRAINT news_content_kind_check CHECK (content_kind IS NULL OR content_kind IN ('noticia','previa','cronica','entrevista','ultima_hora'));
CREATE INDEX IF NOT EXISTS news_special_slug_idx ON public.news(special_slug) WHERE special_slug IS NOT NULL;
ALTER TABLE public.live_results ADD COLUMN IF NOT EXISTS external_ref text NULL;
ALTER TABLE public.special_piece_members ADD COLUMN IF NOT EXISTS next_schedule_item_id uuid NULL REFERENCES public.schedule_items(id) ON DELETE SET NULL;