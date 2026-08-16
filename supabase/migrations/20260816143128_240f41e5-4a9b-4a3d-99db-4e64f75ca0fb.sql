CREATE OR REPLACE FUNCTION public.mfa_strict()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_factor boolean;
  aal text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = auth.uid() AND f.status = 'verified'
  ) INTO has_factor;

  IF NOT has_factor THEN
    RETURN false;
  END IF;

  aal := COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'aal', '');
  RETURN aal = 'aal2';
END;
$function$;

REVOKE ALL ON FUNCTION public.mfa_strict() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfa_strict() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_account_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.mfa_strict()) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  RETURN QUERY SELECT u.id, u.email::text FROM auth.users u;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_account_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_account_emails() TO authenticated, service_role;