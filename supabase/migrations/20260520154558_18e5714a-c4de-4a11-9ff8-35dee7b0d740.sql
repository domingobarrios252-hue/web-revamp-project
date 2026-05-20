UPDATE public.country_hubs
SET active_sections = active_sections || '["live"]'::jsonb
WHERE country_code = 'es'
  AND NOT (active_sections @> '["live"]'::jsonb);