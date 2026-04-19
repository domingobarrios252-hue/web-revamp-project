-- Tabla de páginas legales editables
CREATE TABLE public.legal_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal pages viewable by everyone"
  ON public.legal_pages FOR SELECT
  USING (true);

CREATE POLICY "Admins/editors can insert legal pages"
  ON public.legal_pages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins/editors can update legal pages"
  ON public.legal_pages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete legal pages"
  ON public.legal_pages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Precargar las 3 páginas legales vacías
INSERT INTO public.legal_pages (slug, title, content) VALUES
  ('privacidad', 'Política de Privacidad', ''),
  ('aviso-legal', 'Aviso Legal', ''),
  ('cookies', 'Política de Cookies', '');

-- Datos del titular en site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('legal_owner', jsonb_build_object(
    'name', 'RollerZone',
    'legal_name', 'RollerZone',
    'tax_id', '[PENDIENTE]',
    'address', '[PENDIENTE - España]',
    'email', '[PENDIENTE]',
    'phone', '',
    'country', 'España'
  ))
ON CONFLICT (key) DO NOTHING;