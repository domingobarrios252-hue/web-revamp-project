
CREATE TABLE public.club_hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, country_code)
);
GRANT SELECT ON public.club_hubs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.club_hubs TO authenticated;
GRANT ALL ON public.club_hubs TO service_role;
ALTER TABLE public.club_hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club_hubs read all" ON public.club_hubs FOR SELECT USING (true);
CREATE POLICY "club_hubs editorial write" ON public.club_hubs FOR ALL TO authenticated
  USING (public.is_editorial_staff(auth.uid()))
  WITH CHECK (public.is_editorial_staff(auth.uid()));

CREATE TABLE public.federation_hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id uuid NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (federation_id, country_code)
);
GRANT SELECT ON public.federation_hubs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.federation_hubs TO authenticated;
GRANT ALL ON public.federation_hubs TO service_role;
ALTER TABLE public.federation_hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "federation_hubs read all" ON public.federation_hubs FOR SELECT USING (true);
CREATE POLICY "federation_hubs editorial write" ON public.federation_hubs FOR ALL TO authenticated
  USING (public.is_editorial_staff(auth.uid()))
  WITH CHECK (public.is_editorial_staff(auth.uid()));
