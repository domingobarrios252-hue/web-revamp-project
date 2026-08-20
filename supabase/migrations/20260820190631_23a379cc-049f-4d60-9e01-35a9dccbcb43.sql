-- 1) Public access flag for magazines
ALTER TABLE public.magazines ADD COLUMN IF NOT EXISTS public_access boolean NOT NULL DEFAULT true;

-- 2) Per-section editor permissions
CREATE TABLE IF NOT EXISTS public.editor_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section text NOT NULL,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, section)
);

GRANT SELECT ON public.editor_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.editor_permissions TO authenticated;
GRANT ALL ON public.editor_permissions TO service_role;

ALTER TABLE public.editor_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own editor permissions" ON public.editor_permissions;
CREATE POLICY "Users read own editor permissions"
  ON public.editor_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage editor permissions" ON public.editor_permissions;
CREATE POLICY "Admins manage editor permissions"
  ON public.editor_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied())
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied());

DROP TRIGGER IF EXISTS trg_editor_permissions_updated_at ON public.editor_permissions;
CREATE TRIGGER trg_editor_permissions_updated_at
  BEFORE UPDATE ON public.editor_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Secure permission check helper
CREATE OR REPLACE FUNCTION public.has_section_permission(_user_id uuid, _section text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.editor_permissions ep
        WHERE ep.user_id = _user_id
          AND ep.section = _section
          AND CASE _action
                WHEN 'create'  THEN ep.can_create
                WHEN 'edit'    THEN ep.can_edit
                WHEN 'delete'  THEN ep.can_delete
                WHEN 'publish' THEN ep.can_publish
                ELSE false
              END
      );
$$;