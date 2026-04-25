ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS review_feedback TEXT;

CREATE OR REPLACE FUNCTION public.is_editorial_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'editor')
      OR public.has_role(_user_id, 'colaborador');
$$;

CREATE OR REPLACE FUNCTION public.has_assigned_section(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.section_id IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'editor')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

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
    ELSE
      RAISE EXCEPTION 'insufficient editorial permissions';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF is_admin_user THEN
      IF NEW.status IS NULL THEN
        NEW.status := OLD.status;
      END IF;
    ELSIF is_editor_user OR is_colab_user THEN
      IF OLD.created_by <> auth.uid() THEN
        RAISE EXCEPTION 'editors can only edit their own content';
      END IF;
      IF user_section IS NULL OR OLD.section_id IS DISTINCT FROM user_section THEN
        RAISE EXCEPTION 'editors can only edit content in their assigned section';
      END IF;
      NEW.created_by := OLD.created_by;
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

DROP POLICY IF EXISTS "Admins/editors can insert news" ON public.news;
DROP POLICY IF EXISTS "Admins/editors can update news" ON public.news;
DROP POLICY IF EXISTS "Admins can delete news" ON public.news;
DROP POLICY IF EXISTS "Colaboradores can view their own news" ON public.news;
DROP POLICY IF EXISTS "Colaboradores can insert their own news" ON public.news;
DROP POLICY IF EXISTS "Colaboradores can update their own news" ON public.news;
DROP POLICY IF EXISTS "Colaboradores can delete their own drafts" ON public.news;
DROP POLICY IF EXISTS "Editors can view assigned section news" ON public.news;
DROP POLICY IF EXISTS "Editors can insert assigned section news" ON public.news;
DROP POLICY IF EXISTS "Editors can update own section news" ON public.news;
DROP POLICY IF EXISTS "Editors can delete own unpublished section news" ON public.news;
DROP POLICY IF EXISTS "Admins can manage all news" ON public.news;

CREATE POLICY "Admins can manage all news"
ON public.news
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can view assigned section news"
ON public.news
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND section_id = public.current_user_section_id()
  AND created_by = auth.uid()
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

CREATE POLICY "Editors can update own section news"
ON public.news
FOR UPDATE
USING (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND created_by = auth.uid()
  AND section_id = public.current_user_section_id()
  AND status <> 'published'
)
WITH CHECK (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND created_by = auth.uid()
  AND section_id = public.current_user_section_id()
  AND status <> 'published'
);

CREATE POLICY "Editors can delete own unpublished section news"
ON public.news
FOR DELETE
USING (
  (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'colaborador'))
  AND created_by = auth.uid()
  AND section_id = public.current_user_section_id()
  AND status IN ('draft', 'pending', 'rejected')
);

DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own non privileged profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own non privileged profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND section_id IS NOT DISTINCT FROM public.current_user_section_id()
);

CREATE INDEX IF NOT EXISTS idx_news_section_status ON public.news(section_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_by_status ON public.news(created_by, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_section ON public.profiles(user_id, section_id);