DROP POLICY IF EXISTS "Public read visible result-documents" ON storage.objects;

CREATE POLICY "Public read visible result-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'result-documents'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
    OR EXISTS (
      SELECT 1 FROM public.result_documents rd
      WHERE rd.visible = true
        AND rd.status = ANY (ARRAY['oficial'::public.result_doc_status, 'provisional'::public.result_doc_status])
        AND rd.file_path = storage.objects.name
    )
  )
);