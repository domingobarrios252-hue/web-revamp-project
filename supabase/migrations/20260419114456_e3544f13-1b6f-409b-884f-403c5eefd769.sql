-- Tabla de items del ticker
CREATE TABLE public.ticker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticker_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticker items viewable by everyone"
  ON public.ticker_items FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can insert ticker items"
  ON public.ticker_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update ticker items"
  ON public.ticker_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete ticker items"
  ON public.ticker_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ticker_items_updated_at
  BEFORE UPDATE ON public.ticker_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de ajustes del sitio (key/value)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial
INSERT INTO public.site_settings (key, value) VALUES
  ('ticker_enabled', 'true'::jsonb);

INSERT INTO public.ticker_items (text, sort_order) VALUES
  ('Chevi Guzmán bate el récord de pista en 500m', 1),
  ('Liga Nacional 3ª División · Jornada 4 en curso', 2),
  ('Open Madrid 2026 · Inscripciones abiertas', 3),
  ('Daniel Milagros convocado con la selección española', 4),
  ('Adrián Alonso · Nuevo patrocinador con Bont Skates', 5),
  ('Campeonato Internacional Bogotá · Resultados disponibles', 6),
  ('Livio Wenger debuta en la Liga Nacional 2026', 7);