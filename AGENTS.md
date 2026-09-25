
- Event streaming lives in result_events.stream_* (reusing stream_url); Live Center entries may link via live_timeline.result_event_id (ON DELETE RESTRICT). Why: no parallel streaming system.
- vite.config.ts defines server-only SUPABASE_* env as globalThis.process.env entity names in environments.ssr. Why: publish build rejected non-literal injected defines.
- Results link to events by ID: live_results.result_event_id + schedule_item_id (both ON DELETE SET NULL); event_slug kept for legacy public URLs. Provider per result_events.results_provider (manual default). Why: VeloPro must not depend on text matching.
