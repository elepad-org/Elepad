-- Add assignedTo column to activities table (nullable for backwards compatibility)
-- Using quotes to preserve camelCase naming
ALTER TABLE public.activities ADD COLUMN "assignedTo" uuid;

-- Add foreign key constraint
ALTER TABLE public.activities 
  ADD CONSTRAINT "activities_assignedTo_fkey" 
  FOREIGN KEY ("assignedTo") REFERENCES public.users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "idx_activities_assignedTo" ON public.activities("assignedTo");

-- Add comment to document the schema change
COMMENT ON COLUMN public.activities."assignedTo" IS 'User to whom the activity is assigned (recipient). NULL for legacy activities. For new activities: can be same as createdBy for self-assigned activities, or an elder in the same family group.';
