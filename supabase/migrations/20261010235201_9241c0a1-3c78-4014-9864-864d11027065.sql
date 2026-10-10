DROP POLICY IF EXISTS "News visibility viewable by everyone" ON public.news_visibility;
CREATE POLICY "News visibility of published news is public" ON public.news_visibility
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_visibility.news_id AND n.status = 'published'));
CREATE POLICY "Editorial staff read all news visibility" ON public.news_visibility
  FOR SELECT TO authenticated
  USING (public.is_editorial_staff(auth.uid()));

DROP POLICY IF EXISTS "fed docs viewable by everyone" ON public.federation_documents;
CREATE POLICY "Published federation documents are public" ON public.federation_documents
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now()
    AND EXISTS (SELECT 1 FROM public.federations f WHERE f.id = federation_documents.federation_id AND f.published = true));
CREATE POLICY "Admins and editors read all federation documents" ON public.federation_documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Magazine pages readable by free magazines" ON storage.objects;
CREATE POLICY "Magazine pages readable by free magazines" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'magazine-pages' AND EXISTS (
    SELECT 1 FROM public.magazines m
    WHERE m.id::text = (storage.foldername(objects.name))[1] AND m.is_free = true AND m.published = true));