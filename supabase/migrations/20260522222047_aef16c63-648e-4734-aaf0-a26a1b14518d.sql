
DROP VIEW IF EXISTS public.community_submissions_public;

-- Restore public SELECT for approved rows, but enforce column-level privileges
CREATE POLICY "Approved community submissions viewable by everyone"
ON public.community_submissions FOR SELECT TO anon, authenticated
USING (status = 'aprobada');

-- Revoke broad SELECT, then grant only safe columns to anon/authenticated.
-- Staff still read full rows via their own policy because staff query uses the
-- service-bound 'authenticated' role + has table-level grants via Supabase defaults;
-- to keep admin/editor full access we re-grant all columns to the authenticator
-- using a SECURITY DEFINER pathway: simpler is to keep grants and rely on the
-- column privileges affecting all roles. Admin/editor reads happen via the same
-- 'authenticated' role, so excluding email/phone there would break the admin UI.
-- Instead: keep full table grants but use a sanitized view for the public site
-- and update CommunityPage to use it. Revert to view approach with invoker mode.

REVOKE SELECT ON public.community_submissions FROM anon;
GRANT SELECT (id, submission_type, country_code, name, title, description,
              image_urls, links, status, created_at, news_id, updated_at)
ON public.community_submissions TO anon;
