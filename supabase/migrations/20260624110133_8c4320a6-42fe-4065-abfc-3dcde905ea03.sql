
CREATE TABLE public.special_pieces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  special_slug TEXT NOT NULL,
  slug TEXT NOT NULL,
  number TEXT NOT NULL DEFAULT '',
  kicker TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  visible BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (special_slug, slug)
);

GRANT SELECT ON public.special_pieces TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_pieces TO authenticated;
GRANT ALL ON public.special_pieces TO service_role;

ALTER TABLE public.special_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible pieces"
  ON public.special_pieces FOR SELECT
  USING (visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pieces"
  ON public.special_pieces FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pieces"
  ON public.special_pieces FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pieces"
  ON public.special_pieces FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_special_pieces_updated_at
  BEFORE UPDATE ON public.special_pieces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX special_pieces_special_order_idx
  ON public.special_pieces (special_slug, sort_order);

INSERT INTO public.special_pieces (special_slug, slug, number, kicker, title, description, image_url, sort_order, featured, visible, status) VALUES
('camino-al-europeo-2026', 'presentacion-europeo-2026', '01', 'Presentación', 'El Europeo 2026, en juego en Cardano al Campo', 'Qué es, dónde se disputa y por qué este Europeo marca la temporada del patinaje de velocidad.', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80', 10, true, true, 'live'),
('camino-al-europeo-2026', 'convocatoria-seleccion-espanola', '02', 'Selección', 'Convocatoria oficial de la selección española', 'Los patinadores y patinadoras elegidos por Garikoitz Lerga para defender a España en el Europeo.', 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=80', 20, true, true, 'live'),
('camino-al-europeo-2026', 'calendario-y-sedes', '03', 'Agenda', 'Calendario y sedes del Europeo', 'Día a día del campeonato: ceremonia, pista, ruta y maratón en Cardano al Campo.', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80', 30, false, true, 'live'),
('camino-al-europeo-2026', 'entrevista-seleccionador', '04', 'Entrevista', 'Entrevista al seleccionador y protagonistas', 'Las voces que marcarán el camino de España hasta Italia.', 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80', 40, false, true, 'live'),
('camino-al-europeo-2026', 'informacion-campeonato', '05', 'Guía', 'Información del campeonato y datos clave', 'Ficha técnica, sede, accesos e información útil del Europeo 2026.', 'https://images.unsplash.com/photo-1505739679850-7adc7c2dbbf6?auto=format&fit=crop&w=1600&q=80', 50, false, true, 'live'),
('camino-al-europeo-2026', 'resultados-y-medallero', '06', 'Resultados', 'Resultados y medallero del Europeo', 'Espacio preparado para seguir las medallas y la actuación española durante el campeonato.', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80', 60, false, true, 'preparing'),
('camino-al-europeo-2026', 'galeria-rollerzone-tv', '07', 'Galería', 'Galería y RollerZone TV del Europeo', 'Fotos, vídeos y momentos en directo del Europeo a través de RollerZone TV.', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80', 70, false, true, 'preparing');
