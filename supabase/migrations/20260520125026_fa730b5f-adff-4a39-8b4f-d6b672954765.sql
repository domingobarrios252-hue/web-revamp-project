
INSERT INTO storage.buckets (id, name, public)
VALUES ('federations', 'federations', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Federations images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'federations');

CREATE POLICY "Authenticated upload federations"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'federations');

CREATE POLICY "Authenticated update federations"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'federations');

CREATE POLICY "Authenticated delete federations"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'federations');
