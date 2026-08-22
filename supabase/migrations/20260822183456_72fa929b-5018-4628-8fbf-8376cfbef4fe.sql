REVOKE EXECUTE ON FUNCTION public.editor_country_code(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_country_editor(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.interviews_enforce_editorial_rules() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_interview_changes() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.editor_country_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_country_editor(uuid) TO authenticated;