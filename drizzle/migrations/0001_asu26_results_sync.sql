ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_result_id text,
  ADD COLUMN IF NOT EXISTS source_competition_id text,
  ADD COLUMN IF NOT EXISTS source_missing_passes integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS live_results_source_result_uidx
  ON public.live_results (result_event_id, source_result_id) WHERE source_result_id IS NOT NULL;

CREATE TABLE public.results_sync_state (
  key text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  source_base_url text NOT NULL,
  modalidad_slug text NOT NULL,
  target_result_event_id uuid NOT NULL REFERENCES public.result_events(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  emergency_stop boolean NOT NULL DEFAULT false,
  halted boolean NOT NULL DEFAULT false,
  halt_reason text,
  halted_at timestamptz,
  reactivated_by uuid,
  reactivated_at timestamptz,
  default_priority text NOT NULL DEFAULT 'official' CHECK (default_priority IN ('official','manual')),
  active_from date NOT NULL DEFAULT '2026-10-10',
  active_to date NOT NULL DEFAULT '2026-10-18',
  off_window_mode text NOT NULL DEFAULT 'paused' CHECK (off_window_mode IN ('paused','every6h')),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_rows integer,
  last_error text,
  consecutive_failures integer NOT NULL DEFAULT 0,
  lock_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.results_sync_state TO authenticated;
GRANT ALL ON public.results_sync_state TO service_role;
ALTER TABLE public.results_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view sync state" ON public.results_sync_state FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER update_results_sync_state_updated_at BEFORE UPDATE ON public.results_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.asu26_results_links (
  sync_key text NOT NULL REFERENCES public.results_sync_state(key) ON DELETE CASCADE,
  source_competition_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  competition_date date,
  source_state text,
  schedule_item_id uuid REFERENCES public.schedule_items(id) ON DELETE SET NULL,
  link_status text NOT NULL DEFAULT 'pending' CHECK (link_status IN ('pending','auto','confirmed','ignored')),
  priority text CHECK (priority IN ('official','manual')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sync_key, source_competition_id)
);
GRANT SELECT, UPDATE ON public.asu26_results_links TO authenticated;
GRANT ALL ON public.asu26_results_links TO service_role;
ALTER TABLE public.asu26_results_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view result links" ON public.asu26_results_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Staff can update result links" ON public.asu26_results_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER update_asu26_results_links_updated_at BEFORE UPDATE ON public.asu26_results_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prioridad efectiva por prueba (lectura pública, sin datos sensibles)
CREATE OR REPLACE FUNCTION public.results_priority_map(_event uuid)
RETURNS TABLE(schedule_item_id uuid, priority text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.schedule_item_id, COALESCE(l.priority, s.default_priority)
    FROM public.asu26_results_links l
    JOIN public.results_sync_state s ON s.key = l.sync_key
   WHERE s.target_result_event_id = _event
     AND l.schedule_item_id IS NOT NULL
     AND l.link_status IN ('auto','confirmed');
$$;
GRANT EXECUTE ON FUNCTION public.results_priority_map(uuid) TO anon, authenticated;

-- Controles admin: emergencia, reactivación y ajustes
CREATE OR REPLACE FUNCTION public.results_sync_control(_key text, _action text, _value text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'insufficient privileges'; END IF;
  IF _action = 'emergency_on' THEN
    UPDATE results_sync_state SET emergency_stop = true, halted = true, halt_reason = 'Interruptor de emergencia activado', halted_at = now() WHERE key = _key;
  ELSIF _action = 'reactivate' THEN
    UPDATE results_sync_state SET emergency_stop = false, halted = false, halt_reason = NULL, consecutive_failures = 0,
      reactivated_by = auth.uid(), reactivated_at = now() WHERE key = _key;
  ELSIF _action = 'set_enabled' THEN
    UPDATE results_sync_state SET enabled = (_value = 'true') WHERE key = _key;
  ELSIF _action = 'set_priority' AND _value IN ('official','manual') THEN
    UPDATE results_sync_state SET default_priority = _value WHERE key = _key;
  ELSIF _action = 'set_off_window' AND _value IN ('paused','every6h') THEN
    UPDATE results_sync_state SET off_window_mode = _value WHERE key = _key;
  ELSE
    RAISE EXCEPTION 'invalid action';
  END IF;
  PERFORM public.log_security_event('results_sync_' || _action, 'results_sync_state', _key, 'success', jsonb_build_object('value', _value));
END $$;
REVOKE ALL ON FUNCTION public.results_sync_control(text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.results_sync_control(text,text,text) TO authenticated;

INSERT INTO public.results_sync_state (key, label, source_base_url, modalidad_slug, target_result_event_id)
VALUES ('asu26_speed', 'ASU26 · Patinaje de velocidad', 'https://ofjvystehjkofgexaqay.supabase.co/rest/v1', 'speed', '8af85269-de02-4b16-b98f-8a4e7b7df6ee');