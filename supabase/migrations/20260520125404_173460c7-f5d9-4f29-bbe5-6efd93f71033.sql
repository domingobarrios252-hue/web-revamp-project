
INSERT INTO public.regions (code, name, sort_order) VALUES
  ('CTB', 'Cantabria', 100),
  ('LRJ', 'La Rioja', 101),
  ('ARA', 'Aragón', 102),
  ('EXT', 'Extremadura', 103),
  ('CLM', 'Castilla-La Mancha', 104),
  ('BAL', 'Baleares', 105),
  ('CNY', 'Canarias', 106),
  ('CEU', 'Ceuta', 107),
  ('MEL', 'Melilla', 108)
ON CONFLICT (code) DO NOTHING;
