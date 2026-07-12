-- 1. Añadir rol LECTOR al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lector';

-- 2. Añadir columna de suspensión a profiles (soft-ban)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- 3. Actualizar el trigger de nuevos usuarios: asignar 'lector' por defecto
--    en lugar de 'editor'. No toca usuarios existentes.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  -- Rol por defecto: LECTOR. Nunca editor ni admin de forma automática.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'lector')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 4. Historial de lectura (revistas consultadas por el lector).
CREATE TABLE IF NOT EXISTS public.magazine_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  magazine_id UUID NOT NULL REFERENCES public.magazines(id) ON DELETE CASCADE,
  first_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, magazine_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.magazine_reads TO authenticated;
GRANT ALL ON public.magazine_reads TO service_role;

ALTER TABLE public.magazine_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reads"
  ON public.magazine_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log their own reads"
  ON public.magazine_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reads"
  ON public.magazine_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all reads"
  ON public.magazine_reads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
