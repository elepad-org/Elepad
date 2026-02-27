-- Add Spotify support to memories table
ALTER TABLE "memories"
ADD COLUMN IF NOT EXISTS "spotifyTrackId" text,
ADD COLUMN IF NOT EXISTS "spotifyUri" text,
ADD COLUMN IF NOT EXISTS "spotifyData" jsonb;

-- Add comment to document the new columns
COMMENT ON COLUMN "memories"."spotifyTrackId" IS 'Spotify track ID for music memories';
COMMENT ON COLUMN "memories"."spotifyUri" IS 'Spotify URI (spotify:track:xxx) for deep linking';
COMMENT ON COLUMN "memories"."spotifyData" IS 'Full track data from Spotify API (name, artist, album, preview_url, etc.)';
