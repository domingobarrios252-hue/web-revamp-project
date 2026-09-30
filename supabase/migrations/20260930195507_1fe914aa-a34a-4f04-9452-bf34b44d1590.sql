CREATE TABLE public.territory_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_code text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.territory_zones(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (territory_code, parent_id, slug)
);
GRANT SELECT ON public.territory_zones TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.territory_zones TO authenticated;
GRANT ALL ON public.territory_zones TO service_role;
ALTER TABLE public.territory_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zones public read" ON public.territory_zones FOR SELECT USING (true);
CREATE POLICY "Zones admin insert" ON public.territory_zones FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Zones admin update" ON public.territory_zones FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Zones admin delete" ON public.territory_zones FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_territory_zones_updated BEFORE UPDATE ON public.territory_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS zone_region_id uuid REFERENCES public.territory_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zone_city_id uuid REFERENCES public.territory_zones(id) ON DELETE SET NULL;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS zone_region_id uuid REFERENCES public.territory_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zone_city_id uuid REFERENCES public.territory_zones(id) ON DELETE SET NULL;

ALTER TABLE public.news DISABLE TRIGGER USER;
WITH fl AS (
  INSERT INTO public.territory_zones (territory_code, slug, name, sort_order) VALUES ('mia','florida','Florida',1) RETURNING id
), mi AS (
  INSERT INTO public.territory_zones (territory_code, slug, name, parent_id, sort_order) SELECT 'mia','miami','Miami',id,1 FROM fl RETURNING id, parent_id
), u1 AS (
  UPDATE public.news SET zone_region_id = (SELECT parent_id FROM mi), zone_city_id = (SELECT id FROM mi)
  WHERE slug = 'miami-inline-marathon-2026-cuatro-dias-para-vivir-el-patinaje-en-una-de-las-gran' RETURNING 1
)
UPDATE public.news SET zone_region_id = (SELECT id FROM fl)
WHERE slug = 'el-bont-florida-inline-skating-marathon-2026-reunira-en-sarasota-a-patinadores-d';
ALTER TABLE public.news ENABLE TRIGGER USER;