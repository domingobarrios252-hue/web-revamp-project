-- Reversión de la Fase 0 (protección del calendario).
-- Devuelve la base de datos al estado anterior a la migración 0018.
-- NO toca datos: los 40 eventos y sus relaciones quedan intactos.
-- El historial (event_change_log) se conserva exportado: ejecutar antes
--   psql -c "\copy (select * from public.event_change_log) to 'event_change_log.csv' csv header"
-- si se quiere conservar fuera de la base de datos.

DROP TRIGGER IF EXISTS trg_block_event_delete ON public.events;
DROP TRIGGER IF EXISTS trg_event_change_log ON public.events;
DROP FUNCTION IF EXISTS public.block_event_delete();
DROP FUNCTION IF EXISTS public.log_event_change();
DROP TABLE IF EXISTS public.event_change_log;
ALTER TABLE public.events DROP COLUMN IF EXISTS archived_by;
ALTER TABLE public.events DROP COLUMN IF EXISTS archived_at;

-- Restaurar la política de borrado que existía antes (solo administradores)
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
