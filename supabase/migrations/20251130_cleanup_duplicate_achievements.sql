-- Migration: Cleanup duplicate logic achievements
-- Description: Remove old generic logic achievements, keep only NET-specific ones

-- Eliminar logros genéricos de lógica que ya tienen equivalentes específicos de NET
DELETE FROM public.achievements 
WHERE code IN (
  'logic_first_win',           -- Duplicado de net_first_win
  'logic_lights_out_efficient', -- Lights Out no existe aún
  'logic_lights_out_master'     -- Lights Out no existe aún
);

-- Nota: Mantenemos los 5 logros de NET:
-- 1. net_first_win (Primera Red Conectada)
-- 2. net_speed_master (Maestro de la Velocidad)
-- 3. net_efficient_solver (Solucionador Eficiente)
-- 4. net_perfect_game (Red Perfecta)
-- 5. net_winning_streak (Racha Ganadora)
