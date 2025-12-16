-- Add fields to memoriesBooks to support "baules" (trunks)
ALTER TABLE "memoriesBooks"
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "color" text,
ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();

-- Backfill updatedAt for existing rows (if any)
UPDATE "memoriesBooks"
SET "updatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "updatedAt" IS NULL;
