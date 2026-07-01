
-- Recreate public views as SECURITY DEFINER (invoker=off) so anon can read them
-- without granting anon SELECT on base tables (which would expose email/phone).
ALTER VIEW public.clubs_public SET (security_invoker = off);
ALTER VIEW public.federations_public SET (security_invoker = off);

GRANT SELECT ON public.clubs_public TO anon, authenticated;
GRANT SELECT ON public.federations_public TO anon, authenticated;

-- Restrict contributor_signups reads to admins only
DROP POLICY IF EXISTS "Staff can read contributor signups" ON public.contributor_signups;
CREATE POLICY "Admins can read contributor signups"
  ON public.contributor_signups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
