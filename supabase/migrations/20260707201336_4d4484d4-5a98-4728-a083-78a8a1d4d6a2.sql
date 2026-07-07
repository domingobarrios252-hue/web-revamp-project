
-- 1. Nueva tabla de especiales
CREATE TABLE public.special_editorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  hero_image_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active','hidden','archived','draft')),
  featured_home boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.special_editorials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_editorials TO authenticated;
GRANT ALL ON public.special_editorials TO service_role;

ALTER TABLE public.special_editorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active specials"
  ON public.special_editorials FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert specials"
  ON public.special_editorials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update specials"
  ON public.special_editorials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete specials"
  ON public.special_editorials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_special_editorials_updated_at
  BEFORE UPDATE ON public.special_editorials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Ampliar special_pieces
ALTER TABLE public.special_pieces
  ADD COLUMN IF NOT EXISTS content_md text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS excerpt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS thumbnail_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS external_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_news_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_result_event_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_video_ids uuid[] NOT NULL DEFAULT '{}';

-- Normalizar status: live -> published
UPDATE public.special_pieces SET status = 'published' WHERE status NOT IN ('published','hidden','draft');

-- 3. Seed del especial existente
INSERT INTO public.special_editorials (slug, title, subtitle, description, cover_url, hero_image_url, status, featured_home, sort_order, start_date, end_date)
VALUES (
  'camino-al-europeo-2026',
  'Camino al Europeo 2026',
  'Cobertura especial RollerZone del Campeonato de Europa de Patinaje de Velocidad 2026 en Cardano al Campo.',
  'Reportajes, entrevistas, convocatoria, calendario e información oficial de la selección española en el Europeo de Cardano al Campo 2026.',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1920&q=80',
  'active',
  true,
  1,
  '2026-07-19',
  '2026-07-26'
)
ON CONFLICT (slug) DO NOTHING;
