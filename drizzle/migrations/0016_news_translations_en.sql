CREATE TABLE public.news_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang = 'en'),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  excerpt TEXT,
  content TEXT,
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved')),
  source_hash TEXT,
  translated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (news_id, lang)
);

GRANT SELECT ON public.news_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_translations TO authenticated;
GRANT ALL ON public.news_translations TO service_role;

ALTER TABLE public.news_translations ENABLE ROW LEVEL SECURITY;

-- Public read: only approved translations of published news.
CREATE POLICY "Public reads approved translations of published news"
ON public.news_translations FOR SELECT TO anon
USING (
  status = 'approved'
  AND EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_id AND n.published = true)
);

-- Editorial staff read translations of news they may see/edit.
CREATE POLICY "Editors read translations of editable news"
ON public.news_translations FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.news n
    WHERE n.id = news_id
      AND (n.created_by = auth.uid() OR public.can_edit_country(auth.uid(), n.country_code))
  )
);

CREATE POLICY "Editors create translations of editable news"
ON public.news_translations FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.news n
    WHERE n.id = news_id
      AND (n.created_by = auth.uid() OR public.can_edit_country(auth.uid(), n.country_code))
  )
);

CREATE POLICY "Editors update translations of editable news"
ON public.news_translations FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.news n
    WHERE n.id = news_id
      AND (n.created_by = auth.uid() OR public.can_edit_country(auth.uid(), n.country_code))
  )
);

CREATE POLICY "Only admins delete translations"
ON public.news_translations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Approval stays exclusive to admins, even when an editor can edit the row.
CREATE OR REPLACE FUNCTION public.news_translations_guard_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved')
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Solo un administrador puede aprobar traducciones';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER news_translations_guard_approval
BEFORE UPDATE ON public.news_translations
FOR EACH ROW EXECUTE FUNCTION public.news_translations_guard_approval();

CREATE TRIGGER news_translations_updated_at
BEFORE UPDATE ON public.news_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();