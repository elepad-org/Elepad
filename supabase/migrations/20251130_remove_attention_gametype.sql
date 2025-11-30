-- Migration: Update game_type enum to only include implemented games
-- Description: Updates game_type enum to only include 'memory' and 'logic' (the only games currently implemented)

-- Note: PostgreSQL doesn't support directly removing enum values that are in use
-- This migration will work if no data uses 'attention' or 'calculation' types
-- If there's existing data with those types, it would need to be migrated first

DO $$ 
BEGIN
    -- Create a new enum with only memory and logic
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type_new') THEN
        CREATE TYPE game_type_new AS ENUM ('memory', 'logic');
    END IF;

    -- Remove default first, then alter columns to use the new type
    ALTER TABLE public.puzzles 
        ALTER COLUMN "gameType" DROP DEFAULT;

    ALTER TABLE public.puzzles 
        ALTER COLUMN "gameType" TYPE game_type_new 
        USING "gameType"::text::game_type_new;

    ALTER TABLE public.puzzles 
        ALTER COLUMN "gameType" SET DEFAULT 'memory'::game_type_new;

    ALTER TABLE public.achievements 
        ALTER COLUMN "gameType" TYPE game_type_new 
        USING "gameType"::text::game_type_new;

    -- Drop old type and rename new one
    DROP TYPE game_type;
    ALTER TYPE game_type_new RENAME TO game_type;

    RAISE NOTICE 'Successfully updated game_type enum to only include memory and logic';

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback the new type if something went wrong
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type_new') THEN
            DROP TYPE game_type_new CASCADE;
        END IF;
        RAISE NOTICE 'Failed to update game_type enum: %', SQLERRM;
        RAISE;
END $$;

COMMENT ON TYPE game_type IS 'Game categories: memory (Memoria), logic (NET)';
