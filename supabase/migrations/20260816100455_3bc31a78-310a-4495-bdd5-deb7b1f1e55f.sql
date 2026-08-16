-- Evidencia de declaraciones y crédito fotográfico en envíos de la comunidad
ALTER TABLE public.community_submissions
  ADD COLUMN IF NOT EXISTS photo_credit text,
  ADD COLUMN IF NOT EXISTS has_minors boolean,
  ADD COLUMN IF NOT EXISTS image_paths text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS declarations jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS declarations_version text,
  ADD COLUMN IF NOT EXISTS declarations_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS retention_until timestamptz;

-- Purga del material no publicado cuando deja de ser necesario (retención definida por envío)
CREATE OR REPLACE FUNCTION public.purge_expired_community_submissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  WITH gone AS (
    DELETE FROM public.community_submissions
     WHERE news_id IS NULL
       AND status IN ('pendiente','rechazada','oculta')
       AND retention_until IS NOT NULL
       AND retention_until < now()
    RETURNING id
  )
  SELECT count(*) INTO deleted FROM gone;

  RETURN deleted;
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_expired_community_submissions() FROM anon;
GRANT EXECUTE ON FUNCTION public.purge_expired_community_submissions() TO authenticated;