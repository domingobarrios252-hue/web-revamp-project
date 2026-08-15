-- ============ 1. Security audit log ============
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  resource text,
  resource_id text,
  result text NOT NULL DEFAULT 'success',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_audit_log_created_idx ON public.security_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_log_actor_idx ON public.security_audit_log (actor_id);

GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read security audit log" ON public.security_audit_log;
CREATE POLICY "Admins can read security audit log"
  ON public.security_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- No INSERT/UPDATE/DELETE policies on purpose: only SECURITY DEFINER
-- logging function and service_role may write; rows are immutable from clients.

CREATE OR REPLACE FUNCTION public.log_security_event(
  _action text,
  _resource text DEFAULT NULL,
  _resource_id text DEFAULT NULL,
  _result text DEFAULT 'success',
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  role_txt text;
  email_txt text;
  safe_details jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT string_agg(ur.role::text, ',') INTO role_txt
    FROM public.user_roles ur WHERE ur.user_id = auth.uid();
  SELECT p.email INTO email_txt FROM public.profiles p WHERE p.user_id = auth.uid();

  -- Never persist credentials / tokens even if a caller passes them in.
  safe_details := COALESCE(_details, '{}'::jsonb)
    - 'password' - 'access_token' - 'refresh_token' - 'token'
    - 'api_key' - 'apikey' - 'secret' - 'cookie' - 'authorization';

  INSERT INTO public.security_audit_log (actor_id, actor_email, actor_role, action, resource, resource_id, result, details)
  VALUES (auth.uid(), email_txt, role_txt, left(_action, 120), left(_resource, 120), left(_resource_id, 120), left(COALESCE(_result,'success'), 40), safe_details)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, text, jsonb) TO authenticated, service_role;

-- Automatic logging of role changes (privilege escalation trail)
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (actor_id, actor_role, action, resource, resource_id, result, details)
  VALUES (
    auth.uid(),
    (SELECT string_agg(ur.role::text, ',') FROM public.user_roles ur WHERE ur.user_id = auth.uid()),
    'role_' || lower(TG_OP),
    'user_roles',
    COALESCE(NEW.user_id, OLD.user_id)::text,
    'success',
    jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles_changes();

-- Automatic logging of news deletion / publication
CREATE OR REPLACE FUNCTION public.audit_news_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (actor_id, action, resource, resource_id, details)
    VALUES (auth.uid(), 'news_delete', 'news', OLD.id::text, jsonb_build_object('slug', OLD.slug, 'title', OLD.title));
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.security_audit_log (actor_id, action, resource, resource_id, details)
    VALUES (auth.uid(), 'news_status_change', 'news', NEW.id::text,
            jsonb_build_object('slug', NEW.slug, 'from', OLD.status, 'to', NEW.status));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_news ON public.news;
CREATE TRIGGER trg_audit_news
AFTER UPDATE OR DELETE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.audit_news_changes();

-- ============ 2. Rate limiting ============
CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id bigserial PRIMARY KEY,
  action text NOT NULL,
  identity text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_hits_lookup_idx ON public.rate_limit_hits (action, identity, created_at DESC);

GRANT ALL ON public.rate_limit_hits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limit_hits_id_seq TO service_role;
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (bypasses RLS) and the definer function below.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action text,
  _identity text,
  _max_hits integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hits integer;
BEGIN
  DELETE FROM public.rate_limit_hits WHERE created_at < now() - interval '1 day';

  SELECT count(*) INTO hits
    FROM public.rate_limit_hits
   WHERE action = _action
     AND identity = _identity
     AND created_at > now() - make_interval(secs => _window_seconds);

  IF hits >= _max_hits THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_hits (action, identity) VALUES (_action, left(_identity, 200));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

-- ============ 3. CSP violation reports (report-only mode) ============
CREATE TABLE IF NOT EXISTS public.csp_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_uri text,
  blocked_uri text,
  violated_directive text,
  effective_directive text,
  disposition text,
  user_agent text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS csp_reports_created_idx ON public.csp_reports (created_at DESC);

GRANT SELECT ON public.csp_reports TO authenticated;
GRANT ALL ON public.csp_reports TO service_role;
ALTER TABLE public.csp_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read csp reports" ON public.csp_reports;
CREATE POLICY "Admins can read csp reports"
  ON public.csp_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ 4. MFA (TOTP) gate for admin role changes ============
-- true when the caller has no verified TOTP factor yet (no lock-out during rollout)
-- or when the current session already passed the second factor (aal2).
CREATE OR REPLACE FUNCTION public.mfa_satisfied()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    RETURN true;
  END IF;

  aal := COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'aal', '');
  RETURN aal = 'aal2';
END;
$$;

REVOKE ALL ON FUNCTION public.mfa_satisfied() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated, service_role;

-- Role changes now additionally require a second factor when the admin has one enrolled.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied());

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied());

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied());

-- ============ 5. Public forms move to the server (rate limit + anti-bot) ============
REVOKE INSERT ON public.newsletter_subscribers FROM anon, authenticated;
REVOKE INSERT ON public.contributor_signups FROM anon, authenticated;
REVOKE INSERT ON public.community_submissions FROM anon, authenticated;