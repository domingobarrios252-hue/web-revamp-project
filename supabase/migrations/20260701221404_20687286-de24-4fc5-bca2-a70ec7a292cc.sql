
ALTER TABLE public.country_hubs
  ADD COLUMN IF NOT EXISTS quick_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_magazine boolean NOT NULL DEFAULT false;

-- Seed defaults for existing hubs when quick_links is empty
UPDATE public.country_hubs
   SET quick_links = '[
     {"section":"competicion","label":"Liga Nacional"},
     {"section":"competicion","label":"Campeonatos"},
     {"section":"clubes","label":"Clubs"},
     {"section":"patinadores","label":"Patinadores"},
     {"section":"mvp","label":"MVP"},
     {"section":"tv","label":"TV"}
   ]'::jsonb
 WHERE quick_links = '[]'::jsonb;

-- Enable magazine section for Colombia by default
UPDATE public.country_hubs SET show_magazine = true WHERE country_code = 'co';
