
-- Extend result_events with premium/competition metadata (all optional)
ALTER TABLE public.result_events
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS season text,
  ADD COLUMN IF NOT EXISTS competition_type text,
  ADD COLUMN IF NOT EXISTS main_category text,
  ADD COLUMN IF NOT EXISTS poster_url text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS organizer text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS show_in_home boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_result_events_show_in_home
  ON public.result_events (show_in_home, home_order)
  WHERE show_in_home = true;

-- Extend live_results with dorsal, federation, points, notes, status
ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS bib text,
  ADD COLUMN IF NOT EXISTS federation text,
  ADD COLUMN IF NOT EXISTS points numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS result_status text NOT NULL DEFAULT 'oficial';

-- Live Center event -> result_events link
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS converted_result_event_id uuid REFERENCES public.result_events(id) ON DELETE SET NULL;

-- Convert Live Center event into a result_events page (idempotent)
CREATE OR REPLACE FUNCTION public.convert_live_to_result_event(_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev RECORD;
  new_id uuid;
  new_slug text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;

  SELECT * INTO ev FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'event not found';
  END IF;

  IF ev.converted_result_event_id IS NOT NULL THEN
    RETURN ev.converted_result_event_id;
  END IF;

  new_slug := COALESCE(ev.slug, 'evento-' || substr(_event_id::text, 1, 8));

  INSERT INTO public.result_events (
    slug, name, event_date, country, banner_url, status, sort_order, published,
    city, venue, stream_url, competition_type, season
  ) VALUES (
    new_slug,
    ev.name,
    ev.start_date::date,
    COALESCE(ev.country, NULL),
    ev.cover_url,
    'finalizado',
    0,
    true,
    ev.location,
    ev.location,
    ev.cover_url,
    'evento',
    to_char(COALESCE(ev.start_date, now()), 'YYYY')
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO new_id;

  UPDATE public.events SET converted_result_event_id = new_id WHERE id = _event_id;

  -- Attach existing live_results rows (by event_slug) to this page: they already
  -- reference the same slug so no data move is needed.
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_live_to_result_event(uuid) TO authenticated;
