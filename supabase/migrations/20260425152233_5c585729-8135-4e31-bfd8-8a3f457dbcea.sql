CREATE OR REPLACE FUNCTION public.news_enforce_editorial_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user BOOLEAN;
  is_editor_user BOOLEAN;
  is_colab_user BOOLEAN;
  user_section UUID;
BEGIN
  is_admin_user := public.has_role(auth.uid(), 'admin');
  is_editor_user := public.has_role(auth.uid(), 'editor');
  is_colab_user := public.has_role(auth.uid(), 'colaborador');
  user_section := public.current_user_section_id();

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF is_admin_user THEN
      NEW.status := COALESCE(NEW.status, 'published');
    ELSIF is_editor_user OR is_colab_user THEN
      IF user_section IS NULL THEN
        RAISE EXCEPTION 'editor section required';
      END IF;
      NEW.created_by := auth.uid();
      NEW.section_id := user_section;
      NEW.status := 'pending';
      NEW.featured := false;
      NEW.review_feedback := NULL;
    ELSE
      RAISE EXCEPTION 'insufficient editorial permissions';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF is_admin_user THEN
      IF NEW.status IS NULL THEN
        NEW.status := OLD.status;
      END IF;
    ELSIF is_editor_user OR is_colab_user THEN
      IF user_section IS NULL OR OLD.section_id IS DISTINCT FROM user_section THEN
        RAISE EXCEPTION 'editors can only edit content in their assigned section';
      END IF;
      NEW.created_by := COALESCE(OLD.created_by, auth.uid());
      NEW.section_id := OLD.section_id;
      NEW.status := 'pending';
      NEW.published_at := OLD.published_at;
      NEW.featured := false;
      NEW.review_feedback := NULL;
    ELSE
      RAISE EXCEPTION 'insufficient editorial permissions';
    END IF;
  END IF;

  NEW.published := (NEW.status = 'published');

  IF NEW.status <> 'published' THEN
    NEW.featured := false;
  END IF;

  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "Editors can view assigned section news" ON public.news;
DROP POLICY IF EXISTS "Editors can insert assigned section news" ON public.news;
DROP POLICY IF EXISTS "Editors can update own section news" ON public.news;
DROP POLICY IF EXISTS "Editors can delete own unpublished section news" ON public.news;

CREATE POLICY "Editors can view assigned section news"
ON public.news
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND section_id = public.current_user_section_id()
);

CREATE POLICY "Editors can insert assigned section news"
ON public.news
FOR INSERT
WITH CHECK (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND public.has_assigned_section(auth.uid())
  AND created_by = auth.uid()
  AND section_id = public.current_user_section_id()
  AND status <> 'published'
);

CREATE POLICY "Editors can update section news"
ON public.news
FOR UPDATE
USING (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND section_id = public.current_user_section_id()
)
WITH CHECK (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND section_id = public.current_user_section_id()
  AND status <> 'published'
);

CREATE POLICY "Editors can delete unpublished section news"
ON public.news
FOR DELETE
USING (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND section_id = public.current_user_section_id()
  AND status IN ('draft', 'pending', 'rejected')
);