-- Exigir segundo factor (cuando existe factor verificado) en operaciones administrativas
-- sensibles sobre perfiles: suspensión, cambio de sección y datos personales.
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied())
WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied());

-- Función de comprobación combinada para uso desde funciones de servidor/edge.
CREATE OR REPLACE FUNCTION public.admin_mfa_ok()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') AND public.mfa_satisfied();
$$;

REVOKE ALL ON FUNCTION public.admin_mfa_ok() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mfa_ok() TO authenticated, service_role;