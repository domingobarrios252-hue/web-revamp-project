-- Estado de la prueba
CREATE TYPE public.live_result_status AS ENUM ('en_vivo', 'finalizado');

CREATE TABLE public.live_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  category TEXT,
  status public.live_result_status NOT NULL DEFAULT 'en_vivo',

  -- Top 3 (todos opcionales)
  first_name TEXT,
  first_time TEXT,
  first_club TEXT,

  second_name TEXT,
  second_time TEXT,
  second_club TEXT,

  third_name TEXT,
  third_time TEXT,
  third_club TEXT,

  -- Vínculo opcional a noticia
  news_id UUID REFERENCES public.news(id) ON DELETE SET NULL,

  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_results_status ON public.live_results(status);
CREATE INDEX idx_live_results_published ON public.live_results(published);
CREATE INDEX idx_live_results_news_id ON public.live_results(news_id);

ALTER TABLE public.live_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live results viewable by everyone"
ON public.live_results FOR SELECT
USING (
  published = true
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
);

CREATE POLICY "Admins/editors can insert live results"
ON public.live_results FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
);

CREATE POLICY "Admins/editors can update live results"
ON public.live_results FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'editor'::app_role)
);

CREATE POLICY "Admins can delete live results"
ON public.live_results FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_live_results_updated_at
BEFORE UPDATE ON public.live_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para que el widget se actualice solo
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_results;