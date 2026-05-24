
UPDATE public.live_results
SET gender = CASE
  WHEN category ILIKE '%femenino%' OR gender ILIKE 'femenino' THEN 'Femenino'
  WHEN category ILIKE '%masculino%' OR gender ILIKE 'masculino' THEN 'Masculino'
  ELSE gender
END,
category = CASE
  WHEN category ILIKE 'juvenil%' THEN 'Juvenil'
  WHEN category ILIKE 'junior%' THEN 'Junior'
  WHEN category ILIKE 'senior%' THEN 'Senior'
  ELSE category
END
WHERE event_slug='campeonato-espana-pista-2026';
