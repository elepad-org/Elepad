-- Migration: Add game system support (game types, achievements)
-- Description: Adds support for game types, achievements system, and improves puzzle/attempt tracking

-- 1. Handle game_type enum (categories of games)
-- Drop existing type if it exists and recreate with correct values
DO $$ BEGIN
    -- Check if type exists and drop it if no tables are using it yet
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
        -- Try to drop the type (this will fail if it's in use, which is fine)
        BEGIN
            DROP TYPE game_type CASCADE;
        EXCEPTION
            WHEN dependent_objects_still_exist THEN
                -- If tables are using it, we need to alter it instead
                -- Add new enum values if they don't exist
                BEGIN
                    ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'calculation';
                EXCEPTION WHEN OTHERS THEN null;
                END;
                BEGIN
                    ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'attention';
                EXCEPTION WHEN OTHERS THEN null;
                END;
        END;
    END IF;
    
    -- Create the type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
        CREATE TYPE game_type AS ENUM ('memory', 'logic', 'calculation', 'attention');
    END IF;
END $$;

-- 2. Add gameType column to puzzles table and game identifier
ALTER TABLE public.puzzles 
ADD COLUMN IF NOT EXISTS "gameType" game_type NOT NULL DEFAULT 'memory',
ADD COLUMN IF NOT EXISTS "gameName" text; -- e.g., 'memory_match', 'lights_out', 'sudoku', 'simon_says'

COMMENT ON COLUMN public.puzzles."gameType" IS 'Category of the game (memory, logic, calculation, attention)';
COMMENT ON COLUMN public.puzzles."gameName" IS 'Specific game identifier within the category (e.g., memory_match, lights_out, sudoku)';

-- 3. Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "gameType" game_type NOT NULL,
  code text NOT NULL UNIQUE, -- e.g., 'memory_first_win', 'memory_under_60s', 'logic_under_15_moves'
  title text NOT NULL,
  description text NOT NULL,
  icon text, -- emoji or icon identifier
  condition jsonb NOT NULL, -- stores the conditions to unlock, e.g., {"type": "time", "value": 60}
  points integer NOT NULL DEFAULT 0, -- points awarded for this achievement
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);

-- 4. Create user_achievements table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "achievementId" uuid NOT NULL,
  "unlockedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_userId_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_achievements_achievementId_fkey FOREIGN KEY ("achievementId") REFERENCES public.achievements(id) ON DELETE CASCADE,
  CONSTRAINT user_achievements_unique UNIQUE ("userId", "achievementId")
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempts_userId ON public.attempts("userId");
CREATE INDEX IF NOT EXISTS idx_attempts_memoryPuzzleId ON public.attempts("memoryPuzzleId");
CREATE INDEX IF NOT EXISTS idx_attempts_sudokuPuzzleId ON public.attempts("sudokuPuzzleId");
CREATE INDEX IF NOT EXISTS idx_attempts_logicPuzzleId ON public.attempts("logicPuzzleId");
CREATE INDEX IF NOT EXISTS idx_attempts_startedAt ON public.attempts("startedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_puzzles_gameType ON public.puzzles("gameType");
CREATE INDEX IF NOT EXISTS idx_user_achievements_userId ON public.user_achievements("userId");
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievementId ON public.user_achievements("achievementId");

-- 6. Add constraint to ensure at least one puzzle type is set in attempts
ALTER TABLE public.attempts
ADD CONSTRAINT attempts_one_puzzle_type_check 
CHECK (
  (("memoryPuzzleId" IS NOT NULL)::int + 
   ("sudokuPuzzleId" IS NOT NULL)::int + 
   ("logicPuzzleId" IS NOT NULL)::int) = 1
);

-- 7. Seed initial achievements for memory category games
INSERT INTO public.achievements (code, "gameType", title, description, icon, condition, points) VALUES
  ('memory_first_win', 'memory', 'Primera Victoria de Memoria', 'Completa tu primer juego de Memoria', '🏆', '{"type": "first_completion"}', 10),
  ('memory_speed_demon', 'memory', 'Demonio de la Velocidad', 'Completa el juego de Memoria en menos de 60 segundos', '⚡', '{"type": "time_under", "value": 60}', 25),
  ('memory_efficient', 'memory', 'Memoria Eficiente', 'Completa el juego con menos de 20 movimientos', '🎯', '{"type": "moves_under", "value": 20}', 20),
  ('memory_perfect', 'memory', 'Memoria Perfecta', 'Completa el juego en menos de 45 segundos con menos de 18 movimientos', '💎', '{"type": "combined", "time": 45, "moves": 18}', 50);

-- 8. Seed initial achievements for logic category games (Lights Out, Sudoku, etc.) - preparado para el futuro
INSERT INTO public.achievements (code, "gameType", title, description, icon, condition, points) VALUES
  ('logic_first_win', 'logic', 'Primer Reto Lógico', 'Completa tu primer juego de Lógica', '🏆', '{"type": "first_completion"}', 10),
  ('logic_lights_out_efficient', 'logic', 'Estratega Eficiente', 'Resuelve Lights Out en menos de 15 movimientos', '🧠', '{"type": "moves_under", "value": 15, "game": "lights_out"}', 30),
  ('logic_lights_out_master', 'logic', 'Maestro de Lights Out', 'Resuelve Lights Out en menos de 10 movimientos', '👑', '{"type": "moves_under", "value": 10, "game": "lights_out"}', 50);

-- 9. Comment tables for documentation
COMMENT ON TABLE public.achievements IS 'Stores game achievements that users can unlock';
COMMENT ON TABLE public.user_achievements IS 'Tracks which achievements each user has unlocked';
COMMENT ON COLUMN public.achievements.condition IS 'JSON object defining the conditions to unlock this achievement';
COMMENT ON COLUMN public.attempts.meta IS 'JSON object for storing game-specific data like board state, errors, etc.';
