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
      IF NEW.published = true THEN
        NEW.status := 'published';
      ELSE
        NEW.status := COALESCE(NEW.status, 'draft');
      END IF;
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
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status := NEW.status;
      ELSIF NEW.published IS DISTINCT FROM OLD.published THEN
        NEW.status := CASE WHEN NEW.published THEN 'published'::public.post_status ELSE 'draft'::public.post_status END;
      ELSE
        NEW.status := COALESCE(NEW.status, OLD.status);
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