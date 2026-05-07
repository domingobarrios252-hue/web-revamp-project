ALTER TABLE public.schedule_items REPLICA IDENTITY FULL;
ALTER TABLE public.result_events REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.live_results REPLICA IDENTITY FULL;
ALTER TABLE public.live_stream REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.result_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;