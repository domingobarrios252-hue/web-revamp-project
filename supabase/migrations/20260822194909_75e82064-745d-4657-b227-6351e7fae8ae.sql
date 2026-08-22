CREATE OR REPLACE FUNCTION public.admin_list_account_details()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, email_confirmed boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') AND public.mfa_strict()) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at, (u.email_confirmed_at IS NOT NULL)
      FROM auth.users u;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_account_details() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_account_details() TO authenticated;