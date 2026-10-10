ALTER TABLE public.results_sync_state ADD COLUMN IF NOT EXISTS vensport_last_fetch_at timestamptz, ADD COLUMN IF NOT EXISTS vensport_home_fetched_at timestamptz;
CREATE TABLE public.vensport_pages (
  division_id text PRIMARY KEY,
  sync_key text NOT NULL,
  title text NOT NULL,
  section text NOT NULL DEFAULT '',
  is_section boolean NOT NULL DEFAULT false,
  source_competition_id text,
  competition_date date,
  complete boolean NOT NULL DEFAULT false,
  row_count integer NOT NULL DEFAULT 0,
  last_fetched_at timestamptz,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vensport_pages TO authenticated;
GRANT ALL ON public.vensport_pages TO service_role;
ALTER TABLE public.vensport_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read vensport pages" ON public.vensport_pages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));