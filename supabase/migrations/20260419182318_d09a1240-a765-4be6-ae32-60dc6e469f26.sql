ALTER TABLE public.news
ADD COLUMN writer_id UUID REFERENCES public.writers(id) ON DELETE SET NULL;

CREATE INDEX idx_news_writer_id ON public.news(writer_id);