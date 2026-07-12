DROP POLICY IF EXISTS "Public read result-documents" ON storage.objects;

CREATE POLICY "Public read visible result-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'result-documents'
  AND (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')
    OR EXISTS (
      SELECT 1 FROM public.result_documents rd
      WHERE rd.visible = true
        AND rd.status IN ('oficial','provisional')
        AND (
          rd.file_url LIKE '%/' || storage.objects.name
          OR rd.file_url LIKE '%' || storage.objects.name
        )
    )
  )
);