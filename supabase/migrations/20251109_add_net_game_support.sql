-- Migration: Add NET game achievements
-- Description: Seeds achievements for NET game (logic game variant)
-- Note: The logicGames table already exists in the schema and will be used with gameName='net'

-- Seed initial achievements for NET game
INSERT INTO public.achievements (code, "gameType", title, description, icon, condition, points) VALUES
  -- Logro por primera victoria
  ('net_first_win', 'logic', 'Primera Red Conectada', 'Completa tu primer juego de NET', '🌐', '{"type": "first_completion", "game": "net"}', 10),
  
  -- Logro por completar rápido
  ('net_speed_master', 'logic', 'Maestro de la Velocidad', 'Completa NET en menos de 2 minutos', '⚡', '{"type": "time_under", "value": 120, "game": "net"}', 25),
  
  -- Logro por pocos movimientos
  ('net_efficient_solver', 'logic', 'Solucionador Eficiente', 'Completa NET con menos de 30 movimientos', '🎯', '{"type": "moves_under", "value": 30, "game": "net"}', 20),
  
  -- Logro combinado (difícil)
  ('net_perfect_game', 'logic', 'Red Perfecta', 'Completa NET en menos de 90 segundos con menos de 25 movimientos', '💎', '{"type": "combined", "time": 90, "moves": 25, "game": "net"}', 50),
  
  -- Logro por racha
  ('net_winning_streak', 'logic', 'Racha Ganadora', 'Completa 3 juegos de NET consecutivos', '🔥', '{"type": "streak", "value": 3, "game": "net"}', 30)
ON CONFLICT (code) DO NOTHING;
