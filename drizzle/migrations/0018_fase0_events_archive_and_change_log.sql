-- Fase 0: archivado reversible de competiciones + historial de cambios + bloqueo de borrado físico.
-- Solo añade: columnas opcionales, tabla nueva, funciones y disparadores. No renombra ni elimina nada.

-- 1) Archivado reversible en events (los 40 eventos actuales quedan sin archivar)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS archived_by uuid;
COMMENT ON COLUMN public.events.archived_at IS 'Archivado reversible: no NULL = oculto del calendario público, restaurable desde Admin';
COMMENT ON COLUMN public.events.archived_by IS 'Usuario que archivó la competición';

-- 2) Historial de cambios (append-only; sin FK a events para que el historial sobreviva a cualquier cosa)
CREATE TABLE public.event_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  event_slug text,
  action text NOT NULL CHECK (action IN ('create','update','archive','restore')),
  changed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  old_snapshot jsonb,
  new_snapshot jsonb,
  actor_id uuid,
  source text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_change_log_event_idx ON public.event_change_log (event_id, created_at DESC);
COMMENT ON TABLE public.event_change_log IS 'Historial append-only de competiciones: altas, cambios reales, archivados y restauraciones';

GRANT SELECT ON public.event_change_log TO authenticated;
GRANT ALL ON public.event_change_log TO service_role;

ALTER TABLE public.event_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read event change log"
  ON public.event_change_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Función de historial: registra solo cambios reales (si no cambió ningún campo, no hay entrada)
CREATE OR REPLACE FUNCTION public.log_event_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  diff jsonb;
  k text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.event_change_log (event_id, event_slug, action, changed_fields, new_snapshot, actor_id, source)
    VALUES (NEW.id, NEW.slug, 'create', '{}'::jsonb, to_jsonb(NEW), auth.uid(), 'admin');
    RETURN NEW;
  END IF;

  -- UPDATE: construir diff solo con campos que cambiaron de verdad
  diff := '{}'::jsonb;
  FOR k IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
    IF k IN ('updated_at') THEN CONTINUE; END IF;
    IF to_jsonb(NEW) -> k IS DISTINCT FROM to_jsonb(OLD) -> k THEN
      diff := diff || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(OLD) -> k, 'new', to_jsonb(NEW) -> k));
    END IF;
  END LOOP;

  IF diff = '{}'::jsonb THEN
    RETURN NEW; -- sin cambios reales: no registrar
  END IF;

  INSERT INTO public.event_change_log (event_id, event_slug, action, changed_fields, old_snapshot, new_snapshot, actor_id, source)
  VALUES (
    NEW.id, NEW.slug,
    CASE
      WHEN NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN 'archive'
      WHEN NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL THEN 'restore'
      ELSE 'update'
    END,
    diff, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), 'admin'
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_event_change_log
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_event_change();

-- 4) Bloqueo del borrado físico: el borrado directo queda prohibido para todos los roles de la app
CREATE OR REPLACE FUNCTION public.block_event_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'Las competiciones no se borran: usa Archivar (reversible) desde el administrador' USING ERRCODE = '42501';
END;
$function$;

CREATE TRIGGER trg_block_event_delete
  BEFORE DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.block_event_delete();

-- La política de borrado existente queda inoperativa por el disparador; se retira para que ningún rol intente DELETE
DROP POLICY "Admins can delete events" ON public.events;