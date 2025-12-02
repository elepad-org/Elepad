-- Create table for storing Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON user_google_tokens(user_id);

-- Enable RLS
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own tokens
CREATE POLICY "Users can view own Google tokens" ON user_google_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google tokens" ON user_google_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google tokens" ON user_google_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google tokens" ON user_google_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Function to store Google tokens
CREATE OR REPLACE FUNCTION store_google_tokens(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE,
  p_scope TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expires_at, scope)
  VALUES (p_user_id, p_access_token, p_refresh_token, p_expires_at, p_scope)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    access_token = p_access_token,
    refresh_token = p_refresh_token,
    expires_at = p_expires_at,
    scope = p_scope,
    updated_at = NOW();
END;
$$;

-- Function to get Google tokens
CREATE OR REPLACE FUNCTION get_google_tokens(p_user_id UUID)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    access_token,
    refresh_token,
    expires_at,
    scope
  FROM user_google_tokens
  WHERE user_id = p_user_id;
END;
$$;