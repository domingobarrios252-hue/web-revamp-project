INSERT INTO public.countries (code, name, sort_order, active, accent_color_1, accent_color_2, accent_color_3)
VALUES ('pt', 'Portugal', 51, true, '#006600', '#FFFFFF', '#FF0000')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, active = true;

ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_embed_url text,
  ADD COLUMN IF NOT EXISTS video_poster_url text;