ALTER TABLE public.news
  ADD CONSTRAINT news_country_code_hub_check
  CHECK (country_code IN ('general','es','co','pt','mia'));