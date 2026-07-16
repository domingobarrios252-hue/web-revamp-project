-- Allow anon and authenticated to read objects in result-documents so the
-- frontend can generate signed URLs for public viewing/downloading of PDFs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Public read of result-documents'
  ) THEN
    CREATE POLICY "Public read of result-documents"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'result-documents');
  END IF;
END$$;