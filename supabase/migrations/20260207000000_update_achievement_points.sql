-- Migration: Update achievement points
-- Description: Updates the points for various game achievements to align with the new scoring system.

-- Memory Games
UPDATE public.achievements SET points = 150 WHERE code = 'memory_first_win';
UPDATE public.achievements SET points = 450 WHERE code = 'memory_efficient';
UPDATE public.achievements SET points = 450 WHERE code = 'memory_speed_demon';
UPDATE public.achievements SET points = 750 WHERE code = 'memory_perfect';

-- NET Games
UPDATE public.achievements SET points = 150 WHERE code = 'net_first_win';
UPDATE public.achievements SET points = 450 WHERE code = 'net_efficient_solver';
UPDATE public.achievements SET points = 450 WHERE code = 'net_speed_master';
UPDATE public.achievements SET points = 750 WHERE code = 'net_winning_streak';
UPDATE public.achievements SET points = 750 WHERE code = 'net_perfect_game';

-- Sudoku Games
UPDATE public.achievements SET points = 150 WHERE code = 'sudoku_first_win';
UPDATE public.achievements SET points = 450 WHERE code = 'sudoku_speedster';
UPDATE public.achievements SET points = 750 WHERE code = 'sudoku_precise';
UPDATE public.achievements SET points = 750 WHERE code = 'sudoku_streak_master';

-- Focus Games
UPDATE public.achievements SET points = 150 WHERE code = 'focus_awakening';
UPDATE public.achievements SET points = 450 WHERE code = 'focus_flash';
UPDATE public.achievements SET points = 750 WHERE code = 'focus_surgeon';
UPDATE public.achievements SET points = 750 WHERE code = 'focus_zone';
