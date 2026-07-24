
-- 1) Remove client-side INSERT on magazine_purchases (no real payment verification exists)
DROP POLICY IF EXISTS "Users create own purchases" ON public.magazine_purchases;

-- 2) Enforce suspension in authorization helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = _user_id AND p.suspended_at IS NOT NULL
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_editorial_staff(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'editor')
      OR public.has_role(_user_id, 'colaborador');
$function$;

-- 3) Remove redundant unrestricted public read policy on result-documents storage bucket
DROP POLICY IF EXISTS "Public read of result-documents" ON storage.objects;
