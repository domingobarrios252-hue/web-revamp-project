
-- Remove the overly permissive public SELECT on the base table (exposed email/phone)
DROP POLICY IF EXISTS "Approved community submissions viewable by everyone" ON public.community_submissions;

-- Public-safe view: excludes email and phone, only approved rows
CREATE OR REPLACE VIEW public.community_submissions_public
WITH (security_invoker = false) AS
SELECT
  id,
  submission_type,
  name,
  title,
  description,
  image_urls,
  links,
  status,
  created_at,
  country_code,
  news_id
FROM public.community_submissions
WHERE status = 'aprobada';

GRANT SELECT ON public.community_submissions_public TO anon, authenticated;
