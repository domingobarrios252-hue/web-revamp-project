CREATE TABLE public.collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  year integer NOT NULL DEFAULT date_part('year', now())::int,
  entity text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'federaciones',
  type text NOT NULL DEFAULT 'colaboracion',
  short_description text NOT NULL DEFAULT '',
  content_md text NOT NULL DEFAULT '',
  project_md text NOT NULL DEFAULT '',
  objective_md text NOT NULL DEFAULT '',
  collaboration_md text NOT NULL DEFAULT '',
  result_md text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  entity_logo_url text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text NOT NULL DEFAULT '',
  flipbook_url text NOT NULL DEFAULT '',
  pdf_url text NOT NULL DEFAULT '',
  external_url text NOT NULL DEFAULT '',
  related_news jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  featured_home boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 10,
  published_at timestamptz,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.collaborations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborations TO authenticated;
GRANT ALL ON public.collaborations TO service_role;

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collaborations_public_read_published"
ON public.collaborations FOR SELECT
USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

CREATE POLICY "collaborations_staff_read_all"
ON public.collaborations FOR SELECT TO authenticated
USING (public.is_editorial_staff(auth.uid()));

CREATE POLICY "collaborations_staff_insert"
ON public.collaborations FOR INSERT TO authenticated
WITH CHECK (public.is_editorial_staff(auth.uid()));

CREATE POLICY "collaborations_staff_update"
ON public.collaborations FOR UPDATE TO authenticated
USING (public.is_editorial_staff(auth.uid()))
WITH CHECK (public.is_editorial_staff(auth.uid()));

CREATE POLICY "collaborations_staff_delete"
ON public.collaborations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_collaborations_updated_at
BEFORE UPDATE ON public.collaborations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.collaborations
  (slug, title, year, entity, category, type, short_description, project_md, objective_md, collaboration_md, status, featured_home, sort_order, published_at, seo_title, seo_description)
VALUES
  ('rfep-album-seleccion-2025',
   'Primer Álbum de Cromos de la Selección Española de Patinaje de Velocidad',
   2025,
   'Real Federación Española de Patinaje',
   'federaciones',
   'colaboracion_oficial',
   'RollerZone y la Real Federación Española de Patinaje colaboraron en 2025 en la creación del primer Álbum de Cromos de la Selección Española de Patinaje de Velocidad, un proyecto destinado a acercar la Selección Española a los aficionados y especialmente a las nuevas generaciones.',
   'El primer Álbum de Cromos de la Selección Española de Patinaje de Velocidad nació en 2025 como un proyecto editorial pionero en nuestro deporte, desarrollado por RollerZone junto a la Real Federación Española de Patinaje.',
   'Acercar la Selección Española de Patinaje de Velocidad a los aficionados y, muy especialmente, a las nuevas generaciones, dando visibilidad a sus integrantes y al trabajo de la Federación.',
   'RollerZone asumió la dirección editorial, el diseño y la producción del álbum, en coordinación con la Real Federación Española de Patinaje para la validación de contenidos, imágenes y datos oficiales de la Selección.',
   'published', true, 20, '2025-01-01T00:00:00Z',
   'Primer Álbum de Cromos de la Selección Española 2025 | RollerZone',
   'Colaboración oficial entre RollerZone y la Real Federación Española de Patinaje para crear el primer Álbum de Cromos de la Selección Española de Patinaje de Velocidad.'),
  ('rfep-album-seleccion-2026',
   'Álbum de Cromos de la Selección Española de Patinaje de Velocidad 2026',
   2026,
   'Real Federación Española de Patinaje',
   'federaciones',
   'colaboracion',
   'Una nueva edición del proyecto iniciado en 2025, con una renovada colección dedicada a los integrantes de la Selección Española de Patinaje de Velocidad 2026.',
   'Segunda edición del Álbum de Cromos de la Selección Española de Patinaje de Velocidad, con una colección renovada dedicada a los integrantes de la Selección Española 2026.',
   'Consolidar el álbum como una cita anual del patinaje de velocidad español y seguir acercando la Selección a aficionados, clubes y escuelas.',
   'RollerZone y la Real Federación Española de Patinaje continúan el trabajo conjunto en dirección editorial, diseño y difusión de la colección 2026.',
   'published', true, 10, '2026-01-01T00:00:00Z',
   'Álbum de Cromos de la Selección Española 2026 | RollerZone',
   'Nueva edición del Álbum de Cromos de la Selección Española de Patinaje de Velocidad 2026, proyecto de RollerZone con la Real Federación Española de Patinaje.');