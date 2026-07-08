
CREATE POLICY "Public read result-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'result-documents');

CREATE POLICY "Staff upload result-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'result-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

CREATE POLICY "Staff update result-documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'result-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

CREATE POLICY "Staff delete result-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'result-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));
