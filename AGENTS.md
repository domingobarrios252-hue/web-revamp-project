
- Event streaming lives in result_events.stream_* (reusing stream_url); Live Center entries may link via live_timeline.result_event_id (ON DELETE RESTRICT). Why: no parallel streaming system.
- vite.config.ts defines server-only SUPABASE_* env as globalThis.process.env entity names in environments.ssr. Why: publish build rejected non-literal injected defines.
- Results link to events by ID: live_results.result_event_id + schedule_item_id (both ON DELETE SET NULL); event_slug kept for legacy public URLs. Provider per result_events.results_provider (manual default). Why: VeloPro must not depend on text matching.
- Public results read only via src/lib/results/provider.ts (loadEventResults → normalized rows); VeloPro providers fall back to manual. Why: page never depends on an external service.
- Per-special "no results" text stored in site_settings key special_results_empty:<slug>. Why: editable without a schema change.
- Banner analytics are aggregated daily in ad_banner_stats_daily via record_ad_event() (banner_id ON DELETE SET NULL + banner_ref/name snapshots); render creatives with AdCreative. Why: keep history after deletion, no personal data, one ad manager.
- The statistics route owns its QueryClientProvider and a stable per-mount QueryClient. Why: the app has no global React Query provider, and stats queries must not crash route mounting.
- Special pieces reuse the news block editor (content_blocks jsonb); when empty the public page falls back to content_md. Why: one block system, full backward compatibility.
- Selection pieces use special_piece_members + special_piece_member_results (per piece, CASCADE) and special_pieces.feature_data (summary/closing), independent from skaters (optional skater_id). Why: special cards/images must not alter public skater profiles.
