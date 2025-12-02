-- Migration: Fix logicGames.startState column type and add solution field
-- Description: Changes startState from boolean[] to integer[] to support NET game tile data
--              Also adds a solution field to store the winning configuration
-- The NET game stores tile configurations as [type, rotation] pairs where both are integers

-- Change the column type from boolean[] to integer[]
ALTER TABLE public."logicGames" 
  ALTER COLUMN "startState" TYPE integer[] 
  USING "startState"::text::integer[];

-- Add solution column (optional, stores the winning state)
ALTER TABLE public."logicGames"
  ADD COLUMN IF NOT EXISTS "solution" integer[];

-- Add comments for documentation
COMMENT ON COLUMN public."logicGames"."startState" IS 'Initial state of the logic game board. For NET: array of integers representing [type, rotation, type, rotation, ...] where type is 0-3 (endpoint/straight/corner/t-junction) and rotation is 0/90/180/270';
COMMENT ON COLUMN public."logicGames"."solution" IS 'Solution state of the logic game board. For NET: array of integers representing the correct [type, rotation] pairs to win the game';
