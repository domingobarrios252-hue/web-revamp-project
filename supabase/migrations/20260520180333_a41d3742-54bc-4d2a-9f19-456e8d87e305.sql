-- Bucket público para envíos de la comunidad
INSERT INTO storage.buckets (id, name, public)
VALUES ('community', 'community', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas storage community
DO $$ BEGIN
  CREATE POLICY "Community images are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'community');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can upload community images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'community');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Staff can delete community images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'community'
      AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Asegurar columnas y políticas en community_submissions
DO $$ BEGIN
  ALTER TABLE public.community_submissions
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'es',
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendiente';
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE public.community_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL DEFAULT 'noticia',
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    title text NOT NULL,
    description text NOT NULL,
    image_urls jsonb DEFAULT '[]'::jsonb,
    links jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'pendiente',
    country_code text NOT NULL DEFAULT 'es',
    admin_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
END $$;

ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit to community" ON public.community_submissions;
CREATE POLICY "Anyone can submit to community"
  ON public.community_submissions FOR INSERT
  WITH CHECK (
    status = 'pendiente'
    AND length(title) BETWEEN 3 AND 200
    AND length(description) BETWEEN 10 AND 5000
    AND length(name) BETWEEN 2 AND 120
    AND length(email) BETWEEN 5 AND 200
  );

DROP POLICY IF EXISTS "Staff can read community submissions" ON public.community_submissions;
CREATE POLICY "Staff can read community submissions"
  ON public.community_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Staff can update community submissions" ON public.community_submissions;
CREATE POLICY "Staff can update community submissions"
  ON public.community_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Staff can delete community submissions" ON public.community_submissions;
CREATE POLICY "Staff can delete community submissions"
  ON public.community_submissions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_community_submissions_updated_at ON public.community_submissions;
CREATE TRIGGER update_community_submissions_updated_at
  BEFORE UPDATE ON public.community_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Skaters: flag is_legend (si no existe ya)
ALTER TABLE public.skaters
  ADD COLUMN IF NOT EXISTS is_legend boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_skaters_is_legend ON public.skaters(is_legend) WHERE is_legend = true;