CREATE UNIQUE INDEX IF NOT EXISTS live_results_source_result_full_uidx ON public.live_results (result_event_id, source_result_id);
DROP INDEX IF EXISTS public.live_results_source_result_uidx;