-- Solo el backend puede consumir el control de frecuencia
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

-- rate_limit_hits: solo backend (RLS activo sin políticas = cerrado a clientes)
REVOKE ALL ON public.rate_limit_hits FROM anon, authenticated;
GRANT ALL ON public.rate_limit_hits TO service_role;

-- Registro de auditoría e informes CSP: lectura solo para administradores
DROP POLICY IF EXISTS "security_audit_log_admin_select" ON public.security_audit_log;
CREATE POLICY "security_audit_log_admin_select"
  ON public.security_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "csp_reports_admin_select" ON public.csp_reports;
CREATE POLICY "csp_reports_admin_select"
  ON public.csp_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.security_audit_log FROM anon;
REVOKE ALL ON public.csp_reports FROM anon;
GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT SELECT ON public.csp_reports TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;
GRANT ALL ON public.csp_reports TO service_role;