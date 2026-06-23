ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS hub_countries text[] NOT NULL DEFAULT '{}';

UPDATE public.interviews
   SET hub_countries = ARRAY[country_code]
 WHERE country_code IS NOT NULL
   AND (hub_countries IS NULL OR array_length(hub_countries, 1) IS NULL);

CREATE INDEX IF NOT EXISTS interviews_hub_countries_idx
  ON public.interviews USING GIN (hub_countries);