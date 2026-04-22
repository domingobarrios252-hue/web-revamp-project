-- Refactor live_results: una fila por atleta
-- Conservamos campos básicos, añadimos: position, athlete_name, club, race_time, race, event_slug
-- Eliminamos los campos legacy first/second/third (la tabla está vacía actualmente)

ALTER TABLE public.live_results
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS first_club,
  DROP COLUMN IF EXISTS first_time,
  DROP COLUMN IF EXISTS second_name,
  DROP COLUMN IF EXISTS second_club,
  DROP COLUMN IF EXISTS second_time,
  DROP COLUMN IF EXISTS third_name,
  DROP COLUMN IF EXISTS third_club,
  DROP COLUMN IF EXISTS third_time;

ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS athlete_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS club text,
  ADD COLUMN IF NOT EXISTS race_time text,
  ADD COLUMN IF NOT EXISTS race text,
  ADD COLUMN IF NOT EXISTS event_slug text;

-- Índices útiles para filtrado
CREATE INDEX IF NOT EXISTS idx_live_results_event_slug ON public.live_results(event_slug);
CREATE INDEX IF NOT EXISTS idx_live_results_event_name ON public.live_results(event_name);
CREATE INDEX IF NOT EXISTS idx_live_results_status ON public.live_results(status);

-- Habilitar Realtime
ALTER TABLE public.live_results REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_results;
  END IF;
END $$;