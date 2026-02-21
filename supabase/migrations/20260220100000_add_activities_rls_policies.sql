-- Agrega políticas RLS a la tabla activities.
--
-- Problema: la tabla `users` tiene RLS con "Can view own user data",
-- por lo que una política en activities no puede consultar el groupId
-- de otro usuario directamente. Solución: función SECURITY DEFINER
-- que bypasea RLS para verificar pertenencia al mismo grupo familiar.

-- Función auxiliar reutilizable: verifica si el usuario autenticado
-- pertenece al mismo grupo familiar que otro usuario dado.
CREATE OR REPLACE FUNCTION public.is_same_family_group(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users a
    JOIN public.users b ON a."groupId" = b."groupId"
    WHERE a.id = auth.uid()
      AND b.id = target_user_id
      AND a."groupId" IS NOT NULL
  );
$$;

-- SELECT: un usuario puede ver actividades si pertenece al mismo
-- grupo familiar que el creador de la actividad.
CREATE POLICY "Users can view activities from their family group"
ON public.activities
FOR SELECT
USING ( public.is_same_family_group("createdBy") );
