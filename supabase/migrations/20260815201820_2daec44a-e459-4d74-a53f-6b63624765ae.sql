-- Extension allowlists on uploads (blocks .html, .svg scripts, .exe, .sh, .php, .js ...)
DROP POLICY IF EXISTS "Admins/editors can upload skater images" ON storage.objects;
CREATE POLICY "Admins/editors can upload skater images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'skaters'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','avif','gif'])
  AND octet_length(name) <= 300
);

DROP POLICY IF EXISTS "Staff upload federations" ON storage.objects;
CREATE POLICY "Staff upload federations"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'federations'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','avif','gif','pdf'])
  AND octet_length(name) <= 300
);

DROP POLICY IF EXISTS "Staff upload result-documents" ON storage.objects;
CREATE POLICY "Staff upload result-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'result-documents'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  AND lower(storage.extension(name)) = 'pdf'
  AND octet_length(name) <= 300
);

DROP POLICY IF EXISTS "Admins/editors can upload media" ON storage.objects;
CREATE POLICY "Admins/editors can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','avif','gif','pdf','mp4','webm','mov','m4v'])
  AND octet_length(name) <= 300
);