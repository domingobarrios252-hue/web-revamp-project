-- 1) handle_new_user: ya no copia el email a profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _terms_version text := NULLIF(NEW.raw_user_meta_data->>'terms_version', '');
  _terms_ok boolean := COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false);
  _age_ok boolean := COALESCE((NEW.raw_user_meta_data->>'age_14_confirmed')::boolean, false);
BEGIN
  INSERT INTO public.profiles (user_id, display_name, terms_accepted_at, terms_version, age_confirmed_14_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN _terms_ok THEN now() ELSE NULL END,
    CASE WHEN _terms_ok THEN _terms_version ELSE NULL END,
    CASE WHEN _age_ok THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      terms_accepted_at = COALESCE(public.profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
      terms_version = COALESCE(public.profiles.terms_version, EXCLUDED.terms_version),
      age_confirmed_14_at = COALESCE(public.profiles.age_confirmed_14_at, EXCLUDED.age_confirmed_14_at);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'lector')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) log_security_event: sin email; identifica por actor_id
CREATE OR REPLACE FUNCTION public.log_security_event(_action text, _resource text DEFAULT NULL::text, _resource_id text DEFAULT NULL::text, _result text DEFAULT 'success'::text, _details jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  role_txt text;
  safe_details jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT string_agg(ur.role::text, ',') INTO role_txt
    FROM public.user_roles ur WHERE ur.user_id = auth.uid();

  safe_details := COALESCE(_details, '{}'::jsonb)
    - 'password' - 'access_token' - 'refresh_token' - 'token'
    - 'api_key' - 'apikey' - 'secret' - 'cookie' - 'authorization'
    - 'email' - 'mail';

  INSERT INTO public.security_audit_log (actor_id, actor_role, action, resource, resource_id, result, details)
  VALUES (auth.uid(), role_txt, left(_action, 120), left(_resource, 120), left(_resource_id, 120), left(COALESCE(_result,'success'), 40), safe_details)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;

-- 3) Eliminar columnas de email duplicadas
ALTER TABLE public.security_audit_log DROP COLUMN IF EXISTS actor_email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 4) Email de cuentas sólo para administración con MFA, leído de auth.users
CREATE OR REPLACE FUNCTION public.admin_list_account_emails()
 RETURNS TABLE(user_id uuid, email text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied()) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  RETURN QUERY SELECT u.id, u.email::text FROM auth.users u;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_account_emails() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_account_emails() TO authenticated;

-- 5) Acceso mínimo: los visitantes anónimos no necesitan estas tablas
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.contributor_signups FROM anon;