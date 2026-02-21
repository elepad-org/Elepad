-- Habilita Supabase Realtime para la tabla activities.
-- Esto permite que los clientes suscritos reciban eventos de INSERT/UPDATE/DELETE
-- en tiempo real mediante WebSocket (postgres_changes).
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
