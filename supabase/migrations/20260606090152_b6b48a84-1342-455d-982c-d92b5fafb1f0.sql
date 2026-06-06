
-- RLS policies for magazine-pages bucket: only users who purchased can read; admins/editors can manage
CREATE POLICY "Magazine pages readable by purchasers"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'magazine-pages'
  AND EXISTS (
    SELECT 1 FROM public.magazine_purchases mp
    WHERE mp.user_id = auth.uid()
      AND mp.magazine_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Magazine pages readable by free magazines"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'magazine-pages'
  AND EXISTS (
    SELECT 1 FROM public.magazines m
    WHERE m.id::text = (storage.foldername(name))[1]
      AND m.is_free = true
      AND m.published = true
  )
);

CREATE POLICY "Magazine pages readable by editors"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'magazine-pages'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Magazine pages manageable by editors"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'magazine-pages'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
)
WITH CHECK (
  bucket_id = 'magazine-pages'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);
