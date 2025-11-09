-- Migration: Fix logicGames.startState column type
-- Description: Changes startState from boolean[] to integer[] to support NET game tile data
-- The NET game stores tile configurations as [type, rotation] pairs where both are integers

-- Change the column type from boolean[] to integer[]
ALTER TABLE public."logicGames" 
  ALTER COLUMN "startState" TYPE integer[] 
  USING "startState"::text::integer[];

-- Add comment for documentation
COMMENT ON COLUMN public."logicGames"."startState" IS 'Initial state of the logic game board. For NET: array of integers representing [type, rotation, type, rotation, ...] where type is 0-3 (endpoint/straight/corner/t-junction) and rotation is 0/90/180/270';
