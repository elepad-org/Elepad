-- Add Google Calendar integration columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;

-- Add Google Calendar sync columns to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS google_sync_status TEXT DEFAULT 'pending' CHECK (google_sync_status IN ('pending', 'synced', 'error'));
