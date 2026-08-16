-- Subida pública (solo escritura) al almacén privado de material pendiente de revisión
CREATE POLICY "Community pending: anyone can upload"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'community-pending'
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp'])
  AND octet_length(name) <= 200
);

-- Solo la redacción autorizada puede ver / gestionar el material pendiente
CREATE POLICY "Community pending: staff read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'community-pending'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Community pending: staff delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'community-pending'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

-- El almacén público antiguo deja de aceptar subidas anónimas (las imágenes ya publicadas siguen accesibles)
DROP POLICY IF EXISTS "Anyone can upload community images" ON storage.objects;