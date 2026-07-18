ALTER TABLE public.hall_of_fame
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS national_team text,
  ADD COLUMN IF NOT EXISTS career_years text;