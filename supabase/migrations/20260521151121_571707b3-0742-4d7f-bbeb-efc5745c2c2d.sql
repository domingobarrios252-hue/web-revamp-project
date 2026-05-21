
CREATE TABLE public.home_standings_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_group text NOT NULL,
  division_name text NOT NULL,
  season text NOT NULL DEFAULT 'Temporada 2026',
  display_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.home_standings_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.home_standings_groups(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 1,
  club_name text NOT NULL,
  club_logo text,
  points numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_standings_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_standings_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home standings groups viewable by everyone"
  ON public.home_standings_groups FOR SELECT
  USING (visible = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors insert home standings groups"
  ON public.home_standings_groups FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors update home standings groups"
  ON public.home_standings_groups FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins delete home standings groups"
  ON public.home_standings_groups FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Home standings rows viewable by everyone"
  ON public.home_standings_rows FOR SELECT
  USING (true);

CREATE POLICY "Admins/editors insert home standings rows"
  ON public.home_standings_rows FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors update home standings rows"
  ON public.home_standings_rows FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins delete home standings rows"
  ON public.home_standings_rows FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_home_standings_groups_updated_at
  BEFORE UPDATE ON public.home_standings_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_home_standings_rows_updated_at
  BEFORE UPDATE ON public.home_standings_rows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_home_standings_rows_group ON public.home_standings_rows(group_id, position);

-- Seed the 9 classifications requested
INSERT INTO public.home_standings_groups (competition_group, division_name, season, display_order) VALUES
  ('Liga Nacional Absoluta', '1ª División Masculina', 'Temporada 2026', 1),
  ('Liga Nacional Absoluta', '1ª División Femenina', 'Temporada 2026', 2),
  ('Liga Nacional Absoluta', '2ª División Masculina', 'Temporada 2026', 3),
  ('Liga Nacional Absoluta', '2ª División Femenina', 'Temporada 2026', 4),
  ('Liga Nacional Absoluta', '3ª División Femenina', 'Temporada 2026', 5),
  ('Liga Nacional Sub15', '1ª División Masculina', 'Temporada 2026', 6),
  ('Liga Nacional Sub15', '1ª División Femenina', 'Temporada 2026', 7),
  ('Liga Nacional Sub15', '2ª División Femenina', 'Temporada 2026', 8),
  ('Liga Nacional Sub15', '3ª División Femenina', 'Temporada 2026', 9);
