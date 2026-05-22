
-- 1. community_submissions: remove broad public SELECT, expose sanitized view
DROP POLICY IF EXISTS "Approved community submissions viewable by everyone" ON public.community_submissions;

CREATE OR REPLACE VIEW public.community_submissions_public
WITH (security_invoker = false) AS
SELECT id, submission_type, country_code, name, title, description,
       image_urls, links, status, created_at, news_id
FROM public.community_submissions
WHERE status = 'aprobada';

GRANT SELECT ON public.community_submissions_public TO anon, authenticated;

-- 2. federations bucket: restrict writes to admin/editor
DROP POLICY IF EXISTS "Authenticated upload federations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update federations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete federations" ON storage.objects;

CREATE POLICY "Staff upload federations"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'federations'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.has_role(auth.uid(), 'editor'::public.app_role))
);

CREATE POLICY "Staff update federations"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'federations'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.has_role(auth.uid(), 'editor'::public.app_role))
);

CREATE POLICY "Staff delete federations"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'federations'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.has_role(auth.uid(), 'editor'::public.app_role))
);

-- 3. community bucket uploads: restrict to image extensions
DROP POLICY IF EXISTS "Anyone can upload community images" ON storage.objects;

CREATE POLICY "Anyone can upload community images"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'community'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif')
  AND octet_length(name) <= 200
);

UPDATE storage.buckets
SET file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'community';

-- 4. profiles UPDATE policy: scope to authenticated
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
