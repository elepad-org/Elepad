-- Migration: Add user streaks functionality
-- Description: Creates tables to track user daily game streaks

-- Table to store current and longest streak for each user
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE,
  "currentStreak" integer NOT NULL DEFAULT 0,
  "longestStreak" integer NOT NULL DEFAULT 0,
  "lastPlayedDate" date,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_streaks_pkey PRIMARY KEY (id),
  CONSTRAINT user_streaks_userId_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

-- Table to store history of days when user played (for calendar visualization)
CREATE TABLE IF NOT EXISTS public.streak_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "playedDate" date NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT streak_history_pkey PRIMARY KEY (id),
  CONSTRAINT streak_history_userId_date_unique UNIQUE ("userId", "playedDate"),
  CONSTRAINT streak_history_userId_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_userId ON public.user_streaks("userId");
CREATE INDEX IF NOT EXISTS idx_streak_history_userId ON public.streak_history("userId");
CREATE INDEX IF NOT EXISTS idx_streak_history_playedDate ON public.streak_history("playedDate");
CREATE INDEX IF NOT EXISTS idx_streak_history_userId_playedDate ON public.streak_history("userId", "playedDate");

-- Enable Row Level Security
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_streaks
-- Users can view streaks of anyone in their family group
CREATE POLICY "Users can view streaks from their family group"
  ON public.user_streaks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1, public.users u2
      WHERE u1.id = auth.uid() 
      AND u2.id = user_streaks."userId"
      AND u1."groupId" = u2."groupId"
      AND u1."groupId" IS NOT NULL
    )
    OR auth.uid() = "userId" -- Can always see own streak
  );

-- Users can insert/update their own streak data
CREATE POLICY "Users can manage their own streaks"
  ON public.user_streaks
  FOR ALL
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- RLS Policies for streak_history
-- Users can view streak history of anyone in their family group
CREATE POLICY "Users can view streak history from their family group"
  ON public.streak_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1, public.users u2
      WHERE u1.id = auth.uid() 
      AND u2.id = streak_history."userId"
      AND u1."groupId" = u2."groupId"
      AND u1."groupId" IS NOT NULL
    )
    OR auth.uid() = "userId" -- Can always see own history
  );

-- Users can insert their own streak history
CREATE POLICY "Users can manage their own streak history"
  ON public.streak_history
  FOR ALL
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updatedAt
CREATE TRIGGER user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_streaks TO authenticated;
GRANT SELECT, INSERT ON public.streak_history TO authenticated;
