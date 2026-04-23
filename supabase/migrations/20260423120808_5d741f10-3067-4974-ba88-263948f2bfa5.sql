-- 1) Drop skater_rankings table (replaced by live_results)
DROP TABLE IF EXISTS public.skater_rankings CASCADE;

-- 2) Add 'upcoming' (próxima) value to live_result_status enum
ALTER TYPE public.live_result_status ADD VALUE IF NOT EXISTS 'proxima';

-- 3) Add points column to live_results (optional)
ALTER TABLE public.live_results
  ADD COLUMN IF NOT EXISTS points numeric;

-- 4) Add location column to schedule_items for upcoming events display
ALTER TABLE public.schedule_items
  ADD COLUMN IF NOT EXISTS location text;