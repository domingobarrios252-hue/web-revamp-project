ALTER TABLE public.special_editorials
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_mode_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS results_provider text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_event_ref text;

CREATE OR REPLACE FUNCTION public.enforce_single_event_mode()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.event_mode_active THEN
    UPDATE public.special_editorials SET event_mode_active = false
    WHERE id <> NEW.id AND event_mode_active;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_single_event_mode ON public.special_editorials;
CREATE TRIGGER trg_single_event_mode BEFORE INSERT OR UPDATE OF event_mode_active
ON public.special_editorials FOR EACH ROW EXECUTE FUNCTION public.enforce_single_event_mode();