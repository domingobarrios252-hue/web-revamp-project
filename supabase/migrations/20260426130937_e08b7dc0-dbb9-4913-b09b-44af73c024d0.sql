DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_center_status') THEN
    CREATE TYPE public.live_center_status AS ENUM ('upcoming', 'live', 'finished');
  END IF;
END $$;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS status public.live_center_status NOT NULL DEFAULT 'upcoming';

CREATE TABLE IF NOT EXISTS public.live_stream (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'LIVE CENTER',
  embed_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  autoplay BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  race_name TEXT NOT NULL,
  category TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status public.live_center_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  athlete_name TEXT NOT NULL,
  club TEXT,
  country TEXT,
  time TEXT,
  gap TEXT,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_live_center_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_races_event_status_time ON public.races(event_id, status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_results_race_position ON public.results(race_id, position);

ALTER TABLE public.live_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active live streams viewable by everyone" ON public.live_stream;
CREATE POLICY "Active live streams viewable by everyone"
ON public.live_stream
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins editors can insert live streams" ON public.live_stream;
CREATE POLICY "Admins editors can insert live streams"
ON public.live_stream
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins editors can update live streams" ON public.live_stream;
CREATE POLICY "Admins editors can update live streams"
ON public.live_stream
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins can delete live streams" ON public.live_stream;
CREATE POLICY "Admins can delete live streams"
ON public.live_stream
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Races viewable by everyone" ON public.races;
CREATE POLICY "Races viewable by everyone"
ON public.races
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins editors can insert races" ON public.races;
CREATE POLICY "Admins editors can insert races"
ON public.races
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins editors can update races" ON public.races;
CREATE POLICY "Admins editors can update races"
ON public.races
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins can delete races" ON public.races;
CREATE POLICY "Admins can delete races"
ON public.races
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Results viewable by everyone" ON public.results;
CREATE POLICY "Results viewable by everyone"
ON public.results
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins editors can insert results" ON public.results;
CREATE POLICY "Admins editors can insert results"
ON public.results
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins editors can update results" ON public.results;
CREATE POLICY "Admins editors can update results"
ON public.results
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Admins can delete results" ON public.results;
CREATE POLICY "Admins can delete results"
ON public.results
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_live_stream_updated_at ON public.live_stream;
CREATE TRIGGER update_live_stream_updated_at
BEFORE UPDATE ON public.live_stream
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_races_updated_at ON public.races;
CREATE TRIGGER update_races_updated_at
BEFORE UPDATE ON public.races
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_results_updated_at ON public.results;
CREATE TRIGGER update_results_updated_at
BEFORE UPDATE ON public.results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.races;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;