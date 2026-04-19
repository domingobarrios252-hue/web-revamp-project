-- 1. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Harden register_news_view: strict hash format + per-visitor rate limit
CREATE OR REPLACE FUNCTION public.register_news_view(_news_id uuid, _visitor_hash text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inserted BOOLEAN := false;
  new_count INTEGER;
  recent_count INTEGER;
BEGIN
  -- Enforce strict hash format (UUID-like or 64-char hex)
  IF _visitor_hash IS NULL
     OR NOT (
       _visitor_hash ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
       OR _visitor_hash ~ '^[a-f0-9]{32,128}$'
     )
  THEN
    RAISE EXCEPTION 'invalid visitor hash';
  END IF;

  -- Per-visitor cooldown: prevent more than 1 view insert per second across all articles
  SELECT COUNT(*) INTO recent_count
  FROM public.news_views
  WHERE visitor_hash = _visitor_hash
    AND viewed_at > now() - interval '1 second';

  IF recent_count > 0 THEN
    SELECT views_count INTO new_count FROM public.news WHERE id = _news_id;
    RETURN COALESCE(new_count, 0);
  END IF;

  INSERT INTO public.news_views (news_id, visitor_hash)
  VALUES (_news_id, _visitor_hash)
  ON CONFLICT (news_id, visitor_hash) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted THEN
    UPDATE public.news
    SET views_count = views_count + 1
    WHERE id = _news_id
    RETURNING views_count INTO new_count;
  ELSE
    SELECT views_count INTO new_count FROM public.news WHERE id = _news_id;
  END IF;

  RETURN COALESCE(new_count, 0);
END;
$function$;

-- 3. Restrict storage bucket listing on 'media' and 'skaters'
-- Files remain accessible by direct URL (public buckets), but listing requires admin/editor role
DROP POLICY IF EXISTS "Media files publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Skater images publicly accessible" ON storage.objects;

CREATE POLICY "Media files: admins/editors can list"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Skater images: admins/editors can list"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'skaters'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);