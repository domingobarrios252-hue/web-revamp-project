
- Event streaming lives in result_events.stream_* (reusing stream_url); Live Center entries may link via live_timeline.result_event_id (ON DELETE RESTRICT). Why: no parallel streaming system.
- vite.config.ts defines server-only SUPABASE_* env as globalThis.process.env entity names in environments.ssr. Why: publish build rejected non-literal injected defines.
