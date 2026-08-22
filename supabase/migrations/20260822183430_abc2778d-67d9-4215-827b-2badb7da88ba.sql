-- Miami como territorio editorial (reutiliza countries + country_code)
INSERT INTO public.countries (code, name, active, sort_order)
VALUES ('mia', 'Miami', true, 50)
ON CONFLICT (code) DO NOTHING;

-- Metadatos de autoría/flujo editorial en noticias
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid;

-- Entrevistas: flujo editorial equivalente al de noticias
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS status public.post_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS review_feedback text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.interviews SET status = 'published', published_at = COALESCE(published_at, created_at)
 WHERE published = true AND status <> 'published';

-- Helpers territoriales
CREATE OR REPLACE FUNCTION public.editor_country_code(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT country_code FROM public.editor_countries WHERE user_id = _user_id ORDER BY country_code LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_country_editor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.editor_countries WHERE user_id = _user_id);
$$;

REVOKE EXECUTE ON FUNCTION public.editor_country_code(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_country_editor(uuid) FROM anon;

-- Noticias: permitir a editores territoriales trabajar en su territorio (sin sección asignada)
DROP POLICY IF EXISTS "Country editors insert own news" ON public.news;
CREATE POLICY "Country editors insert own news" ON public.news
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'editor') AND public.is_country_editor(auth.uid())
  AND public.can_edit_country(auth.uid(), country_code)
  AND created_by = auth.uid() AND status <> 'published'
);

DROP POLICY IF EXISTS "Country editors update own news" ON public.news;
CREATE POLICY "Country editors update own news" ON public.news
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'editor') AND public.is_country_editor(auth.uid())
  AND public.can_edit_country(auth.uid(), country_code)
  AND created_by = auth.uid() AND status <> 'published'
)
WITH CHECK (
  public.has_role(auth.uid(), 'editor') AND public.is_country_editor(auth.uid())
  AND public.can_edit_country(auth.uid(), country_code)
  AND created_by = auth.uid() AND status <> 'published'
);

DROP POLICY IF EXISTS "Country editors view own news" ON public.news;
CREATE POLICY "Country editors view own news" ON public.news
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'editor') AND public.is_country_editor(auth.uid())
  AND public.can_edit_country(auth.uid(), country_code)
);

DROP POLICY IF EXISTS "Country editors delete own drafts" ON public.news;
CREATE POLICY "Country editors delete own drafts" ON public.news
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'editor') AND public.is_country_editor(auth.uid())
  AND public.can_edit_country(auth.uid(), country_code)
  AND created_by = auth.uid()
  AND status IN ('draft','pending','rejected')
);

-- Trigger de noticias: soporte para editores territoriales sin sección
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
  user_country TEXT;
BEGIN
  IF TG_OP = 'UPDATE'
     AND auth.uid() IS NULL
     AND NEW.views_count IS DISTINCT FROM OLD.views_count
     AND NEW.id = OLD.id
     AND NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.slug IS NOT DISTINCT FROM OLD.slug
     AND NEW.content IS NOT DISTINCT FROM OLD.content
     AND NEW.published IS NOT DISTINCT FROM OLD.published
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.section_id IS NOT DISTINCT FROM OLD.section_id
     AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
     AND NEW.featured IS NOT DISTINCT FROM OLD.featured
  THEN
    RETURN NEW;
  END IF;

  is_admin_user := public.has_role(auth.uid(), 'admin');
  is_editor_user := public.has_role(auth.uid(), 'editor');
  is_colab_user := public.has_role(auth.uid(), 'colaborador');
  user_section := public.current_user_section_id();
  user_country := public.editor_country_code(auth.uid());

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF is_admin_user THEN
      IF NEW.published = true THEN
        NEW.status := 'published';
      ELSE
        NEW.status := COALESCE(NEW.status, 'draft');
      END IF;
    ELSIF (is_editor_user OR is_colab_user) AND user_country IS NOT NULL THEN
      -- Editor territorial: el territorio se asigna en servidor, nunca desde el formulario
      NEW.created_by := auth.uid();
      NEW.country_code := user_country;
      IF NEW.status NOT IN ('draft','pending') THEN
        NEW.status := 'draft';
      END IF;
      NEW.featured := false;
      NEW.review_feedback := NULL;
      IF NEW.status = 'pending' THEN
        NEW.submitted_at := now();
      END IF;
    ELSIF is_editor_user OR is_colab_user THEN
      IF user_section IS NULL THEN
        RAISE EXCEPTION 'editor section required';
      END IF;
      NEW.created_by := auth.uid();
      NEW.section_id := user_section;
      NEW.status := 'pending';
      NEW.submitted_at := now();
      NEW.featured := false;
      NEW.review_feedback := NULL;
    ELSE
      RAISE EXCEPTION 'insufficient editorial permissions';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF is_admin_user THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status := NEW.status;
      ELSIF NEW.published IS DISTINCT FROM OLD.published THEN
        NEW.status := CASE WHEN NEW.published THEN 'published'::public.post_status ELSE 'draft'::public.post_status END;
      ELSE
        NEW.status := COALESCE(NEW.status, OLD.status);
      END IF;
      IF NEW.status = 'published' AND OLD.status <> 'published' THEN
        NEW.approved_by := auth.uid();
        NEW.approved_at := now();
        NEW.published_by := auth.uid();
      END IF;
    ELSIF (is_editor_user OR is_colab_user) AND user_country IS NOT NULL THEN
      IF OLD.created_by IS DISTINCT FROM auth.uid() OR NOT public.can_edit_country(auth.uid(), OLD.country_code) THEN
        RAISE EXCEPTION 'editors can only edit their own content in their territory';
      END IF;
      NEW.created_by := OLD.created_by;
      NEW.country_code := OLD.country_code;
      NEW.published_at := OLD.published_at;
      NEW.featured := false;
      IF NEW.status NOT IN ('draft','pending') THEN
        NEW.status := 'draft';
      END IF;
      IF NEW.status = 'pending' AND OLD.status <> 'pending' THEN
        NEW.submitted_at := now();
        NEW.review_feedback := NULL;
      END IF;
    ELSIF is_editor_user OR is_colab_user THEN
      IF user_section IS NULL OR OLD.section_id IS DISTINCT FROM user_section THEN
        RAISE EXCEPTION 'editors can only edit content in their assigned section';
      END IF;
      NEW.created_by := COALESCE(OLD.created_by, auth.uid());
      NEW.section_id := OLD.section_id;
      NEW.status := 'pending';
      NEW.submitted_at := now();
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

-- Entrevistas: reglas editoriales equivalentes
CREATE OR REPLACE FUNCTION public.interviews_enforce_editorial_rules()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user BOOLEAN;
  is_staff BOOLEAN;
  user_country TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  is_admin_user := public.has_role(auth.uid(), 'admin');
  is_staff := public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador');
  user_country := public.editor_country_code(auth.uid());

  IF NOT (is_admin_user OR is_staff) THEN
    RAISE EXCEPTION 'insufficient editorial permissions';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF is_admin_user THEN
      IF NEW.published = true THEN NEW.status := 'published'; END IF;
      NEW.status := COALESCE(NEW.status, 'draft');
    ELSE
      NEW.created_by := auth.uid();
      IF user_country IS NOT NULL THEN
        NEW.country_code := user_country;
      END IF;
      IF NEW.status NOT IN ('draft','pending') THEN NEW.status := 'draft'; END IF;
      NEW.review_feedback := NULL;
      IF NEW.status = 'pending' THEN NEW.submitted_at := now(); END IF;
    END IF;
  ELSE
    IF is_admin_user THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status := NEW.status;
      ELSIF NEW.published IS DISTINCT FROM OLD.published THEN
        NEW.status := CASE WHEN NEW.published THEN 'published'::public.post_status ELSE 'draft'::public.post_status END;
      ELSE
        NEW.status := COALESCE(NEW.status, OLD.status);
      END IF;
      IF NEW.status = 'published' AND OLD.status <> 'published' THEN
        NEW.approved_by := auth.uid();
        NEW.approved_at := now();
        NEW.published_by := auth.uid();
        NEW.published_at := COALESCE(NEW.published_at, now());
      END IF;
    ELSE
      IF user_country IS NOT NULL THEN
        IF OLD.created_by IS DISTINCT FROM auth.uid() OR NOT public.can_edit_country(auth.uid(), OLD.country_code) THEN
          RAISE EXCEPTION 'editors can only edit their own content in their territory';
        END IF;
        NEW.country_code := OLD.country_code;
      END IF;
      NEW.created_by := COALESCE(OLD.created_by, auth.uid());
      IF NEW.status NOT IN ('draft','pending') THEN NEW.status := 'draft'; END IF;
      IF NEW.status = 'pending' AND OLD.status <> 'pending' THEN
        NEW.submitted_at := now();
        NEW.review_feedback := NULL;
      END IF;
    END IF;
  END IF;

  NEW.published := (NEW.status = 'published');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS interviews_editorial_rules ON public.interviews;
CREATE TRIGGER interviews_editorial_rules
BEFORE INSERT OR UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.interviews_enforce_editorial_rules();

-- Auditoría de entrevistas reutilizando security_audit_log
CREATE OR REPLACE FUNCTION public.audit_interview_changes()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (actor_id, action, resource, resource_id, details)
    VALUES (auth.uid(), 'interview_delete', 'interviews', OLD.id::text, jsonb_build_object('slug', OLD.slug));
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.security_audit_log (actor_id, action, resource, resource_id, details)
    VALUES (auth.uid(), 'interview_status_change', 'interviews', NEW.id::text,
            jsonb_build_object('slug', NEW.slug, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_interviews ON public.interviews;
CREATE TRIGGER trg_audit_interviews
AFTER UPDATE OR DELETE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.audit_interview_changes();

-- Entrevistas: RLS por territorio y sin publicación directa
DROP POLICY IF EXISTS "Admins/editors can insert interviews" ON public.interviews;
DROP POLICY IF EXISTS "Admins/editors can update interviews" ON public.interviews;
DROP POLICY IF EXISTS "Interviews viewable by everyone" ON public.interviews;
DROP POLICY IF EXISTS "Admins can delete interviews" ON public.interviews;

CREATE POLICY "Published interviews viewable by everyone" ON public.interviews
FOR SELECT USING (published = true OR public.is_editorial_staff(auth.uid()));

CREATE POLICY "Staff can insert interviews" ON public.interviews
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.is_editorial_staff(auth.uid())
    AND created_by = auth.uid()
    AND status <> 'published'
    AND (NOT public.is_country_editor(auth.uid()) OR public.can_edit_country(auth.uid(), country_code))
  )
);

CREATE POLICY "Staff can update interviews" ON public.interviews
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.is_editorial_staff(auth.uid())
    AND status <> 'published'
    AND (NOT public.is_country_editor(auth.uid()) OR (created_by = auth.uid() AND public.can_edit_country(auth.uid(), country_code)))
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.is_editorial_staff(auth.uid())
    AND status <> 'published'
    AND (NOT public.is_country_editor(auth.uid()) OR (created_by = auth.uid() AND public.can_edit_country(auth.uid(), country_code)))
  )
);

CREATE POLICY "Admins can delete interviews" ON public.interviews
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.is_editorial_staff(auth.uid()) AND created_by = auth.uid() AND status <> 'published')
);
