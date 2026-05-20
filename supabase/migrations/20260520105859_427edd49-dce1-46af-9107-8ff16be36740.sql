
CREATE TABLE public.country_hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag_url text,
  accent_color text DEFAULT '#D4A017',
  federation_name text,
  federation_url text,
  hero_image_url text,
  tagline text,
  active_sections jsonb NOT NULL DEFAULT '["inicio","competicion","clubes","patinadores","federaciones","tv","mvp","archivo","comunidad"]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.country_hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Country hubs viewable by everyone"
  ON public.country_hubs FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert country hubs"
  ON public.country_hubs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update country hubs"
  ON public.country_hubs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete country hubs"
  ON public.country_hubs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_country_hubs_updated_at
  BEFORE UPDATE ON public.country_hubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.country_hubs (country_code, name, federation_name, federation_url, tagline, sort_order)
VALUES ('es', 'España', 'Real Federación Española de Patinaje', 'https://www.fep.es', 'El portal de referencia del patinaje de velocidad en España', 1)
ON CONFLICT (country_code) DO NOTHING;
