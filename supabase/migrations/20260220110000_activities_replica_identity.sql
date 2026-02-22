-- Supabase Realtime requiere REPLICA IDENTITY FULL en tablas con RLS habilitado.
-- Sin esto, los eventos de UPDATE y DELETE no incluyen los datos de la fila
-- anterior, lo que impide que Realtime evalúe las políticas RLS y descarta
-- los eventos silenciosamente sin enviarlos al cliente.
--
-- También re-aseguramos que la tabla esté en la publicación supabase_realtime,
-- por si la migración anterior no tuvo efecto (ej: publicación FOR ALL TABLES).
ALTER TABLE public.activities REPLICA IDENTITY FULL;

-- Asegurar que activity_completions también esté configurada correctamente
-- por si en el futuro se necesita suscripción en tiempo real.
ALTER TABLE public.activity_completions REPLICA IDENTITY FULL;
