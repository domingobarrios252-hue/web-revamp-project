-- Add columns to live_results for richer result display
ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS gap text,
  ADD COLUMN IF NOT EXISTS distance text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS is_highlighted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_in_live_center boolean NOT NULL DEFAULT false;

-- New table for result event metadata (banner, country, status)
CREATE TABLE IF NOT EXISTS public.result_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  event_date date,
  country text,
  banner_url text,
  status public.live_result_status NOT NULL DEFAULT 'proxima',
  published boolean NOT NULL DEFAULT true,
  featured_in_live_center boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.result_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Result events viewable by everyone" ON public.result_events;
CREATE POLICY "Result events viewable by everyone"
  ON public.result_events FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins/editors can insert result events" ON public.result_events;
CREATE POLICY "Admins/editors can insert result events"
  ON public.result_events FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins/editors can update result events" ON public.result_events;
CREATE POLICY "Admins/editors can update result events"
  ON public.result_events FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins can delete result events" ON public.result_events;
CREATE POLICY "Admins can delete result events"
  ON public.result_events FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_result_events_updated_at ON public.result_events;
CREATE TRIGGER update_result_events_updated_at
  BEFORE UPDATE ON public.result_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();