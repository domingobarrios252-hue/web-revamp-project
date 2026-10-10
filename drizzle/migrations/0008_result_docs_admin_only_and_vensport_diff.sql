DROP POLICY IF EXISTS "Public read visible result-documents" ON storage.objects;
CREATE POLICY "Public read visible result-documents" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'result-documents' AND (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.result_documents rd WHERE rd.visible = true AND rd.status IN ('oficial'::public.result_doc_status,'provisional'::public.result_doc_status) AND rd.file_path = storage.objects.name)
));
ALTER TABLE public.vensport_pages ADD COLUMN IF NOT EXISTS last_diff jsonb;