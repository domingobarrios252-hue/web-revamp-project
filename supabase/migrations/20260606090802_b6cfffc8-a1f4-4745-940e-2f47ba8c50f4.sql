
-- 1) Make the view run with the caller's permissions, not the owner's
ALTER VIEW public.community_submissions_public SET (security_invoker = true);

-- 2) Allow anon + authenticated to read approved rows (column access controlled by GRANTs)
DROP POLICY IF EXISTS "Public can read approved community submissions" ON public.community_submissions;
CREATE POLICY "Public can read approved community submissions"
ON public.community_submissions
FOR SELECT
TO anon, authenticated
USING (status = 'aprobada');

-- 3) Restrict columns: revoke broad SELECT, grant only safe columns to public roles
REVOKE SELECT ON public.community_submissions FROM anon;
REVOKE SELECT ON public.community_submissions FROM authenticated;

GRANT SELECT (
  id, submission_type, name, title, description,
  image_urls, links, status, created_at, country_code, news_id
) ON public.community_submissions TO anon, authenticated;

-- Keep full DML access for authenticated (RLS still restricts to staff for non-INSERT)
GRANT INSERT, UPDATE, DELETE ON public.community_submissions TO authenticated;
GRANT ALL ON public.community_submissions TO service_role;

-- 4) Admin/editor read of full rows (including email/phone) via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.admin_list_community_submissions()
RETURNS SETOF public.community_submissions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  RETURN QUERY SELECT * FROM public.community_submissions ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_community_submissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_community_submissions() TO authenticated;
