
-- Create public views excluding email/phone
CREATE OR REPLACE VIEW public.clubs_public WITH (security_invoker=on) AS
SELECT id, name, slug, logo_url, region_id, website, created_at, updated_at, country_code,
       cover_url, address, city, province, instagram_url, facebook_url, youtube_url, tiktok_url,
       description, history, school_type, categories, coaches, gallery, featured, published,
       founded_year
FROM public.clubs;

CREATE OR REPLACE VIEW public.federations_public WITH (security_invoker=on) AS
SELECT id, name, slug, short_name, type, country_code, region_code, region_name, logo_url,
       cover_url, description, president, address, city, website, social, parent_id, featured,
       published, founded_year, created_at, updated_at
FROM public.federations;

GRANT SELECT ON public.clubs_public TO anon, authenticated;
GRANT SELECT ON public.federations_public TO anon, authenticated;

-- Restrict base table SELECT to authenticated editorial staff so email/phone are not anon-readable
DROP POLICY IF EXISTS "Clubs viewable by everyone" ON public.clubs;
CREATE POLICY "Clubs viewable by staff"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'colaborador'::app_role)
  );

DROP POLICY IF EXISTS "federations viewable by everyone" ON public.federations;
CREATE POLICY "Federations viewable by staff"
  ON public.federations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'colaborador'::app_role)
  );
