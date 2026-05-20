
-- Extend skaters table
ALTER TABLE public.skaters
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS palmares jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sponsors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg integer,
  ADD COLUMN IF NOT EXISTS dominant_foot text,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_skaters_published ON public.skaters(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_skaters_specialty ON public.skaters(specialty);

-- news_skaters N:N
CREATE TABLE IF NOT EXISTS public.news_skaters (
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  skater_id uuid NOT NULL REFERENCES public.skaters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (news_id, skater_id)
);
CREATE INDEX IF NOT EXISTS idx_news_skaters_skater ON public.news_skaters(skater_id);
ALTER TABLE public.news_skaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_skaters viewable by everyone" ON public.news_skaters FOR SELECT USING (true);
CREATE POLICY "news_skaters insert admin/editor" ON public.news_skaters FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "news_skaters delete admin/editor" ON public.news_skaters FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- result_skaters N:N
CREATE TABLE IF NOT EXISTS public.result_skaters (
  result_id uuid NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  skater_id uuid NOT NULL REFERENCES public.skaters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (result_id, skater_id)
);
CREATE INDEX IF NOT EXISTS idx_result_skaters_skater ON public.result_skaters(skater_id);
ALTER TABLE public.result_skaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "result_skaters viewable by everyone" ON public.result_skaters FOR SELECT USING (true);
CREATE POLICY "result_skaters insert admin/editor" ON public.result_skaters FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "result_skaters delete admin/editor" ON public.result_skaters FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- event_skaters N:N
CREATE TABLE IF NOT EXISTS public.event_skaters (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  skater_id uuid NOT NULL REFERENCES public.skaters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, skater_id)
);
CREATE INDEX IF NOT EXISTS idx_event_skaters_skater ON public.event_skaters(skater_id);
ALTER TABLE public.event_skaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_skaters viewable by everyone" ON public.event_skaters FOR SELECT USING (true);
CREATE POLICY "event_skaters insert admin/editor" ON public.event_skaters FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "event_skaters delete admin/editor" ON public.event_skaters FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  youtube_id text,
  video_url text,
  description text,
  thumbnail_url text,
  duration_seconds integer,
  country_code text NOT NULL DEFAULT 'es',
  category text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_videos_country ON public.videos(country_code);
CREATE INDEX IF NOT EXISTS idx_videos_published ON public.videos(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON public.videos(featured) WHERE featured = true;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos viewable by everyone" ON public.videos FOR SELECT USING (published = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "videos insert admin/editor" ON public.videos FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "videos update admin/editor" ON public.videos FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "videos delete admin" ON public.videos FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- video_skaters N:N
CREATE TABLE IF NOT EXISTS public.video_skaters (
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  skater_id uuid NOT NULL REFERENCES public.skaters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, skater_id)
);
CREATE INDEX IF NOT EXISTS idx_video_skaters_skater ON public.video_skaters(skater_id);
ALTER TABLE public.video_skaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_skaters viewable by everyone" ON public.video_skaters FOR SELECT USING (true);
CREATE POLICY "video_skaters insert admin/editor" ON public.video_skaters FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "video_skaters delete admin/editor" ON public.video_skaters FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- Seed: 12 skaters relacionados con clubes existentes (por slug)
INSERT INTO public.skaters (full_name, slug, photo_url, birth_year, category, gender, specialty, province, country_code, club_id, region_id, palmares, social, sponsors, bio, featured, published, total_points)
SELECT v.full_name, v.slug, v.photo_url, v.birth_year, v.category, v.gender, v.specialty, v.province, 'es',
  (SELECT id FROM public.clubs WHERE slug = v.club_slug LIMIT 1),
  NULL,
  v.palmares::jsonb, v.social::jsonb, v.sponsors::jsonb, v.bio, v.featured, true, v.points
FROM (VALUES
  ('Ioseba Fernández','ioseba-fernandez',NULL,1995,'Senior','M','Velocidad','Barcelona','cpv-reus','[{"year":2024,"event":"Campeonato España Ruta","position":1},{"year":2023,"event":"Europeo Maratón","position":3}]','{"instagram":"@ioseba_skate"}','["Powerslide","Bont"]','Velocista referente nacional, especialista en pruebas de fondo y maratón.',true,950),
  ('Patxi Peula','patxi-peula',NULL,1990,'Senior','M','Maratón','Asturias','astur-patin','[{"year":2024,"event":"Berlin Marathon","position":2},{"year":2023,"event":"Campeonato España","position":1}]','{"instagram":"@patxi_peula","twitter":"@ppeula"}','["Powerslide"]','Múltiple campeón de España en maratón. Récord nacional de los 42K.',true,920),
  ('Aroa Castro','aroa-castro',NULL,1998,'Senior','F','Velocidad','Galicia','club-patin-lugo','[{"year":2024,"event":"Mundial Pista","position":3},{"year":2024,"event":"Europeo 500m","position":2}]','{"instagram":"@aroa_castro_speed"}','["Luigino"]','Velocista olímpica del equipo nacional. Especialista en pista corta.',true,890),
  ('Nerea Langa','nerea-langa',NULL,1999,'Senior','F','Pista','Cataluña','cpv-voltrega','[{"year":2024,"event":"Europeo Pista","position":1},{"year":2023,"event":"Mundial 1000m","position":4}]','{"instagram":"@nerea_langa"}','["Cádomotus"]','Campeona europea en activo. Pieza clave del relevo nacional femenino.',true,910),
  ('Pelayo Menéndez','pelayo-menendez',NULL,2002,'Junior','M','Ruta','Asturias','astur-patin','[{"year":2024,"event":"Campeonato España Junior","position":1}]','{"instagram":"@pelayo_skate"}','["Bont"]','Joven promesa asturiana en categoría junior.',false,720),
  ('Mar Vázquez','mar-vazquez',NULL,2001,'Junior','F','Maratón','Cataluña','cpv-reus','[{"year":2024,"event":"Maratón Barcelona","position":1}]','{"instagram":"@marvazquez_marathon"}','["Powerslide"]','Joven maratoniana en ascenso del CPV Reus.',false,680),
  ('Diego Beltrán','diego-beltran',NULL,1997,'Senior','M','Hockey','Valencia','cp-alcoy','[{"year":2024,"event":"OK Liga","position":2}]','{}','["Reno"]','Jugador de hockey línea con experiencia internacional.',false,540),
  ('Lucía Hernández','lucia-hernandez',NULL,2000,'Senior','F','Artístico','Madrid','cpa-las-rozas','[{"year":2024,"event":"Campeonato España Artístico","position":1},{"year":2023,"event":"Europeo Artístico","position":5}]','{"instagram":"@lucia_skater"}','["Edea","Risport"]','Campeona nacional de patinaje artístico individual senior.',true,830),
  ('Adrián Soler','adrian-soler',NULL,1996,'Senior','M','Artístico','Madrid','cpa-las-rozas','[{"year":2024,"event":"Campeonato España","position":2}]','{"instagram":"@adrian_artistic"}','["Edea"]','Patinador artístico subcampeón nacional.',false,610),
  ('Carlota Vidal','carlota-vidal',NULL,2003,'Junior','F','Velocidad','Cataluña','cpv-voltrega','[{"year":2024,"event":"Campeonato España Junior","position":1}]','{"instagram":"@carlota_speed"}','["Luigino"]','Promesa catalana de la velocidad, dos veces campeona junior.',false,700),
  ('Sergio Castaño','sergio-castano',NULL,1993,'Senior','M','Maratón','Galicia','club-patin-lugo','[{"year":2024,"event":"Maratón A Coruña","position":1},{"year":2023,"event":"Berlin Marathon","position":7}]','{"instagram":"@sergio_castano"}','["Bont"]','Maratoniano gallego con palmarés internacional.',false,780),
  ('Itziar Goñi','itziar-goni',NULL,2004,'Junior','F','Ruta','Navarra','club-patin-lugo','[{"year":2024,"event":"Europeo Junior Ruta","position":3}]','{"instagram":"@itziar_skate"}','["Powerslide"]','Joven talento navarro con podio europeo junior.',false,650)
) AS v(full_name, slug, photo_url, birth_year, category, gender, specialty, province, club_slug, palmares, social, sponsors, bio, featured, points)
WHERE NOT EXISTS (SELECT 1 FROM public.skaters s WHERE s.slug = v.slug);

-- Seed: algunos vídeos demo
INSERT INTO public.videos (title, slug, youtube_id, description, thumbnail_url, country_code, category, featured, published)
VALUES
  ('Highlights Campeonato España Ruta 2024','highlights-cesp-ruta-2024','dQw4w9WgXcQ','Resumen de la prueba reina del calendario nacional.','https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg','es','competicion',true,true),
  ('Entrevista a Aroa Castro','entrevista-aroa-castro','dQw4w9WgXcQ','La velocista habla de su preparación olímpica.','https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg','es','entrevistas',true,true),
  ('Maratón Barcelona — Top 10','maraton-barcelona-top10','dQw4w9WgXcQ','Los 10 mejores momentos del maratón.','https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg','es','competicion',false,true)
ON CONFLICT (slug) DO NOTHING;

-- Relate videos -> skaters
INSERT INTO public.video_skaters (video_id, skater_id)
SELECT v.id, s.id FROM public.videos v, public.skaters s
WHERE (v.slug = 'entrevista-aroa-castro' AND s.slug = 'aroa-castro')
   OR (v.slug = 'maraton-barcelona-top10' AND s.slug IN ('mar-vazquez','patxi-peula','sergio-castano'))
   OR (v.slug = 'highlights-cesp-ruta-2024' AND s.slug IN ('ioseba-fernandez','patxi-peula','pelayo-menendez'))
ON CONFLICT DO NOTHING;
