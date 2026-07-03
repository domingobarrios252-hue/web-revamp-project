
CREATE TYPE public.page_status AS ENUM ('active','hidden','coming_soon');

CREATE TABLE public.page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT,
  route TEXT,
  status public.page_status NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_settings TO authenticated;
GRANT ALL ON public.page_settings TO service_role;

ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_settings public read"
  ON public.page_settings FOR SELECT
  USING (true);

CREATE POLICY "page_settings admin write"
  ON public.page_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_page_settings_updated_at
  BEFORE UPDATE ON public.page_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.page_settings (slug, label, category, route, sort_order) VALUES
  ('inicio','Inicio','Principal','/',1),
  ('noticias','Noticias','Principal','/noticias',2),
  ('eventos','Eventos','Principal','/eventos',3),
  ('resultados','Resultados','Principal','/resultados',4),
  ('rollerzone-tv','RollerZone TV','Principal','/tv',5),
  ('revista','Magazine','Principal','/revista',6),
  ('premios-mvp','MVP RollerZone','Principal','/premios-mvp',7),
  ('entrevistas','Entrevistas','Principal','/entrevistas',8),
  ('patrocinadores','Patrocinadores','Principal','/patrocinadores',9),
  ('redactores','Equipo','Principal','/redactores',10),
  ('salon-de-la-fama','Salón de la Fama','Principal','/salon-de-la-fama',11),
  ('paises','Países','Principal','/paises',12),
  ('espana','España','Países','/hub/es',20),
  ('espana-liga-nacional','Liga Nacional (España)','Países','/hub/es/competicion/liga-nacional',21),
  ('espana-campeonatos','Campeonatos (España)','Países','/hub/es/competicion',22),
  ('espana-seleccion','Selección Española','Países','/camino-al-europeo-2026',23),
  ('espana-clubes','Clubs (España)','Países','/hub/es/clubes',24),
  ('espana-federaciones','Federaciones (España)','Países','/hub/es/federaciones',25),
  ('espana-patinadores','Patinadores (España)','Países','/hub/es/patinadores',26),
  ('espana-mvp','MVP (España)','Países','/hub/es/mvp',27),
  ('colombia','Colombia','Países','/hub/co',30),
  ('venezuela','Venezuela','Países','/hub/ve',31),
  ('rankings','Rankings','Comunidad',NULL,40),
  ('galerias','Galerías','Comunidad',NULL,41),
  ('publicidad','Publicidad','Sobre','/sobre/publicidad',50),
  ('contacto','Contacto','Sobre','/sobre/contacto',51),
  ('quienes-somos','Quiénes somos','Sobre','/sobre/quienes-somos',52)
ON CONFLICT (slug) DO NOTHING;
