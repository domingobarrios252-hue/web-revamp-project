-- Enum de estado editorial
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE public.post_status AS ENUM ('draft', 'pending', 'published');
  END IF;
END$$;

-- Tabla de secciones editoriales
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sections viewable by everyone" ON public.sections;
CREATE POLICY "Sections viewable by everyone" ON public.sections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert sections" ON public.sections;
CREATE POLICY "Admins can insert sections" ON public.sections
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update sections" ON public.sections;
CREATE POLICY "Admins can update sections" ON public.sections
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete sections" ON public.sections;
CREATE POLICY "Admins can delete sections" ON public.sections
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sections (name, slug, sort_order) VALUES
  ('Asturias', 'asturias', 1),
  ('Navarra', 'navarra', 2),
  ('Colombia', 'colombia', 3),
  ('Internacional', 'internacional', 4)
ON CONFLICT (slug) DO NOTHING;

-- Sección asignada al perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;

-- Status y section_id en news
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS status public.post_status NOT NULL DEFAULT 'published';

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;

UPDATE public.news
  SET status = CASE WHEN published THEN 'published'::public.post_status ELSE 'draft'::public.post_status END;

-- Helper: sección del usuario autenticado
CREATE OR REPLACE FUNCTION public.current_user_section_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT section_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Trigger: sincroniza published<->status y aplica reglas para colaboradores
CREATE OR REPLACE FUNCTION public.news_enforce_editorial_rules()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_admin_or_editor BOOLEAN;
  is_colab BOOLEAN;
  user_section UUID;
BEGIN
  is_admin_or_editor := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor');
  is_colab := public.has_role(auth.uid(), 'colaborador');
  user_section := public.current_user_section_id();

  IF TG_OP = 'INSERT' THEN
    IF is_colab AND NOT is_admin_or_editor THEN
      NEW.created_by := auth.uid();
      NEW.section_id := user_section;
      IF NEW.status = 'published' THEN
        NEW.status := 'pending';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF is_colab AND NOT is_admin_or_editor THEN
      NEW.created_by := OLD.created_by;
      NEW.section_id := OLD.section_id;
      IF NEW.status = 'published' AND OLD.status <> 'published' THEN
        NEW.status := 'pending';
      END IF;
    END IF;
  END IF;

  NEW.published := (NEW.status = 'published');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS news_editorial_rules ON public.news;
CREATE TRIGGER news_editorial_rules
  BEFORE INSERT OR UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.news_enforce_editorial_rules();

-- RLS para colaboradores en news
DROP POLICY IF EXISTS "Colaboradores can view their own news" ON public.news;
CREATE POLICY "Colaboradores can view their own news" ON public.news
  FOR SELECT USING (
    public.has_role(auth.uid(), 'colaborador') AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Colaboradores can insert their own news" ON public.news;
CREATE POLICY "Colaboradores can insert their own news" ON public.news
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'colaborador')
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Colaboradores can update their own news" ON public.news;
CREATE POLICY "Colaboradores can update their own news" ON public.news
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'colaborador') AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Colaboradores can delete their own drafts" ON public.news;
CREATE POLICY "Colaboradores can delete their own drafts" ON public.news
  FOR DELETE USING (
    public.has_role(auth.uid(), 'colaborador')
    AND created_by = auth.uid()
    AND status = 'draft'
  );