-- =====================================================================
-- Elepad schema
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============== Users and Family Groups
CREATE TABLE IF NOT EXISTS "users" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         text UNIQUE,
  "passwordHash"  text,
  "displayName"   text,
  "avatarUrl"     text,
  -- Note: groupId FK is added AFTER familyGroups exists to avoid circular creation issues.
  "groupId"       uuid,                    -- FK added later
  "createdAt"     timestamptz NOT NULL DEFAULT now(),
  "updatedAt"     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "users_email_or_federated" CHECK ("email" IS NOT NULL OR "passwordHash" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "familyGroups" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         text NOT NULL,
  -- Owner is the creator and the only admin (who can delete/manage other members).
  "ownerUserId"  uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "createdAt"    timestamptz NOT NULL DEFAULT now()
);

-- Now wire users.groupId to familyGroups.id
ALTER TABLE "users"
  ADD CONSTRAINT "users_group_fk"
  FOREIGN KEY ("groupId") REFERENCES "familyGroups"("id") ON DELETE SET NULL;

-- ============== Memories
CREATE TABLE IF NOT EXISTS "memoriesBooks" (
  "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId"   uuid NOT NULL REFERENCES "familyGroups"("id") ON DELETE CASCADE,
  "title"     text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "memories" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookId"     uuid NOT NULL REFERENCES "memoriesBooks"("id") ON DELETE CASCADE,
  "groupId"    uuid NOT NULL REFERENCES "familyGroups"("id") ON DELETE CASCADE,
  "createdBy"  uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title"      text,
  "caption"    text,
  "mediaUrl"   text,
  "mimeType"   text,
  "createdAt"  timestamptz NOT NULL DEFAULT now()
);

-- ============== Activities
CREATE TABLE IF NOT EXISTS "frequencies" (
  "id"    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "label" text NOT NULL,  -- e.g., "daily", "weekly", "custom"
  "rrule" text            -- optional RFC5545 expression
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdBy"   uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title"       text NOT NULL,
  "description" text,
  "startsAt"    timestamptz NOT NULL,
  "endsAt"      timestamptz,
  "frequencyId" uuid REFERENCES "frequencies"("id") ON DELETE SET NULL,
  "completed"   boolean NOT NULL DEFAULT false,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "activities_time_check" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt")
);

DO $$
BEGIN
  CREATE TYPE game_type AS ENUM ('sudoku', 'memory', 'lightsout');
EXCEPTION
  WHEN duplicate_object THEN
    -- already exists, ignore
    RAISE NOTICE 'game_type enum already exists, skipping creation';
    NULL;
END $$;

-- ============== Puzzles
CREATE TABLE IF NOT EXISTS "puzzles" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "gameType"   game_type NOT NULL,
  "title"      text,
  "difficulty" int,
  "createdAt"  timestamptz NOT NULL DEFAULT now()
);

-- sudokuGames
CREATE TABLE IF NOT EXISTS "sudokuGames" (
  "puzzleId"  uuid PRIMARY KEY REFERENCES "puzzles"("id") ON DELETE CASCADE,
  "rows"      int NOT NULL CHECK ("rows"=9),
  "cols"      int NOT NULL CHECK ("cols"=9),
  "given"     char(81) NOT NULL,   -- '.' for empty
  "solution"  char(81) NOT NULL
);

-- memoryGames
CREATE TABLE IF NOT EXISTS "memoryGames" (
  "puzzleId"  uuid PRIMARY KEY REFERENCES "puzzles"("id") ON DELETE CASCADE,
  "rows"      int NOT NULL,
  "cols"      int NOT NULL,
  "symbols"   text[] NOT NULL,
  "layout"    int[]  NOT NULL
);

-- logicGames
CREATE TABLE IF NOT EXISTS "logicGames" (
  "puzzleId"    uuid PRIMARY KEY REFERENCES "puzzles"("id") ON DELETE CASCADE,
  "rows"        int NOT NULL,
  "cols"        int NOT NULL,
  "startState"  boolean[] NOT NULL
);

CREATE TABLE IF NOT EXISTS "attempts" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"            uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,

  "sudokuPuzzleId"    uuid REFERENCES "sudokuGames"("puzzleId")   ON DELETE CASCADE,
  "memoryPuzzleId"    uuid REFERENCES "memoryGames"("puzzleId")   ON DELETE CASCADE,
  "logicPuzzleId"     uuid REFERENCES "logicGames"("puzzleId")    ON DELETE CASCADE,

  "startedAt"         timestamptz NOT NULL DEFAULT now(),
  "finishedAt"        timestamptz,
  "durationMs"        int,
  "score"             int,
  "success"           boolean,
  "moves"             int,
  "meta"              jsonb,

  -- three optional FKs; exactly one must be set
  CONSTRAINT "attempts_one_fk"
  CHECK (
    (CASE WHEN "sudokuPuzzleId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "memoryPuzzleId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "logicPuzzleId"  IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE "users"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "familyGroups"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memoriesBooks"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memories"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "frequencies"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "puzzles"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sudokuGames"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memoryGames"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "logicGames"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempts"       ENABLE ROW LEVEL SECURITY;
