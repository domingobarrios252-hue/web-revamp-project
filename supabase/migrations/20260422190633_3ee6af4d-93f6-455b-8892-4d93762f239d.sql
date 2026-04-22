-- Tabla de enlaces del bloque "Sobre nosotros"
CREATE TABLE public.about_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  link_type text NOT NULL DEFAULT 'internal', -- 'internal' | 'external' | 'email'
  target text NOT NULL, -- slug interno, URL externa o email
  icon text NOT NULL DEFAULT 'Info',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.about_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "About links viewable by everyone"
  ON public.about_links FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can insert about links"
  ON public.about_links FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update about links"
  ON public.about_links FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete about links"
  ON public.about_links FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_about_links_updated_at
  BEFORE UPDATE ON public.about_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de páginas internas tipo "Quiénes somos"
CREATE TABLE public.about_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.about_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "About pages viewable by everyone"
  ON public.about_pages FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can insert about pages"
  ON public.about_pages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update about pages"
  ON public.about_pages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete about pages"
  ON public.about_pages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_about_pages_updated_at
  BEFORE UPDATE ON public.about_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Datos iniciales: 4 páginas internas vacías
INSERT INTO public.about_pages (slug, title, content, published) VALUES
  ('quienes-somos', 'Quiénes somos', E'# Quiénes somos\n\nEdita este contenido desde el panel de administración.', true),
  ('colabora', 'Colabora con RollerZone', E'# Colabora\n\nEdita este contenido desde el panel de administración.', true),
  ('publicidad', 'Publicidad en RollerZone', E'# Publicidad\n\nEdita este contenido desde el panel de administración.', true),
  ('contacto', 'Contacto', E'# Contacto\n\nEdita este contenido desde el panel de administración.', true);

-- Datos iniciales: 6 enlaces del footer apuntando a las nuevas páginas internas
INSERT INTO public.about_links (label, link_type, target, icon, sort_order, active) VALUES
  ('Quiénes somos', 'internal', 'quienes-somos', 'Info', 1, true),
  ('Equipo', 'internal', 'redactores', 'Users', 2, true),
  ('Redactores', 'internal', 'redactores', 'PenTool', 3, true),
  ('Colabora', 'internal', 'colabora', 'Handshake', 4, true),
  ('Publicidad', 'internal', 'publicidad', 'Megaphone', 5, true),
  ('Contacto', 'internal', 'contacto', 'Mail', 6, true);