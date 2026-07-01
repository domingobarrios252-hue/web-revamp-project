
ALTER VIEW public.clubs_public SET (security_invoker = on);
ALTER VIEW public.federations_public SET (security_invoker = on);

CREATE POLICY "Public can read published clubs"
  ON public.clubs FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Public can read published federations"
  ON public.federations FOR SELECT
  TO anon, authenticated
  USING (published = true);

GRANT SELECT ON public.clubs TO anon;
GRANT SELECT ON public.federations TO anon;
