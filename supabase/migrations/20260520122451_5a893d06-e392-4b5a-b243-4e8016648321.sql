
CREATE TABLE IF NOT EXISTS public.federations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_name text,
  type text NOT NULL DEFAULT 'autonomica',
  country_code text NOT NULL DEFAULT 'es',
  region_code text,
  region_name text,
  logo_url text,
  cover_url text,
  description text,
  president text,
  address text,
  city text,
  email text,
  phone text,
  website text,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  parent_id uuid REFERENCES public.federations(id) ON DELETE SET NULL,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  founded_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_federations_country ON public.federations(country_code);
CREATE INDEX IF NOT EXISTS idx_federations_type ON public.federations(type);
CREATE INDEX IF NOT EXISTS idx_federations_region ON public.federations(region_code);
ALTER TABLE public.federations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "federations viewable by everyone" ON public.federations FOR SELECT USING (published = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "federations insert admin/editor" ON public.federations FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "federations update admin/editor" ON public.federations FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "federations delete admin" ON public.federations FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_federations_updated_at BEFORE UPDATE ON public.federations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.federation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id uuid NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'documento',
  file_url text NOT NULL,
  description text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_federation_docs_fed ON public.federation_documents(federation_id);
ALTER TABLE public.federation_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fed docs viewable by everyone" ON public.federation_documents FOR SELECT USING (true);
CREATE POLICY "fed docs insert admin/editor" ON public.federation_documents FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "fed docs update admin/editor" ON public.federation_documents FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "fed docs delete admin" ON public.federation_documents FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.news_federations (
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  federation_id uuid NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (news_id, federation_id)
);
CREATE INDEX IF NOT EXISTS idx_news_federations_fed ON public.news_federations(federation_id);
ALTER TABLE public.news_federations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_federations viewable by everyone" ON public.news_federations FOR SELECT USING (true);
CREATE POLICY "news_federations insert admin/editor" ON public.news_federations FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "news_federations delete admin/editor" ON public.news_federations FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

CREATE TABLE IF NOT EXISTS public.event_federations (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  federation_id uuid NOT NULL REFERENCES public.federations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, federation_id)
);
CREATE INDEX IF NOT EXISTS idx_event_federations_fed ON public.event_federations(federation_id);
ALTER TABLE public.event_federations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_federations viewable by everyone" ON public.event_federations FOR SELECT USING (true);
CREATE POLICY "event_federations insert admin/editor" ON public.event_federations FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));
CREATE POLICY "event_federations delete admin/editor" ON public.event_federations FOR DELETE USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- Seed: RFEP
INSERT INTO public.federations (name, slug, short_name, type, country_code, description, president, city, website, founded_year, featured, published)
VALUES ('Real Federación Española de Patinaje', 'rfep', 'RFEP', 'nacional', 'es',
  'Órgano rector del patinaje en España. Engloba todas las modalidades: velocidad, artístico, hockey línea, hockey patines, freestyle, alpino, descenso e inline freestyle.',
  'Carmelo Paniagua', 'Reus', 'https://fep.es', 1955, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed: 8 federaciones autonómicas (con parent_id = RFEP)
WITH rfep AS (SELECT id FROM public.federations WHERE slug='rfep')
INSERT INTO public.federations (name, slug, short_name, type, country_code, region_code, region_name, city, description, parent_id, featured, published)
SELECT v.name, v.slug, v.short_name, 'autonomica', 'es', v.region_code, v.region_name, v.city, v.description, (SELECT id FROM rfep), false, true
FROM (VALUES
  ('Federación Catalana de Patinatge','fc-patinatge','FCP','CAT','Cataluña','Barcelona','Federación referente del patinaje español, sede del CPV Reus y Voltregà.'),
  ('Federación Madrileña de Patinaje','fm-patinaje','FMP','MAD','Madrid','Madrid','Coordina competición autonómica y escuelas de la Comunidad de Madrid.'),
  ('Federación Andaluza de Patinaje','fand-patinaje','FAP','AND','Andalucía','Sevilla','Promueve el patinaje en las ocho provincias andaluzas.'),
  ('Federación Valenciana de Patinaje','fv-patinaje','FVP','VAL','Valencia','Valencia','Federación de la Comunitat Valenciana.'),
  ('Federación Gallega de Patinaxe','fg-patinaxe','FGP','GAL','Galicia','A Coruña','Federación gallega con fuerte tradición en velocidad y artístico.'),
  ('Federación Asturiana de Patinaje','fa-patinaje','FAP-AST','AST','Asturias','Oviedo','Federación del Principado de Asturias.'),
  ('Federación Vasca de Patinaje','fv-patinaje-eh','EHIF','PVA','País Vasco','Bilbao','Euskadiko Herri Irristaketa Federazioa.'),
  ('Federación Navarra de Patinaje','fn-patinaje','FNP','NAV','Navarra','Pamplona','Federación foral de Navarra.')
) AS v(name, slug, short_name, region_code, region_name, city, description)
WHERE NOT EXISTS (SELECT 1 FROM public.federations f WHERE f.slug = v.slug);
