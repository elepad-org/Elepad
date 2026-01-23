-- Add timezone column to users table
-- Type: text - stores timezone strings like 'America/New_York', 'Europe/London', etc.
alter table "public"."users" 
  add column "timezone" text;

-- Add comment to document the column
comment on column "public"."users"."timezone" is 'User timezone in IANA format (e.g., America/New_York, Europe/London)';

-- Set default timezone for existing users (Argentina)
update "public"."users" 
set "timezone" = 'America/Argentina/Buenos_Aires' 
where "timezone" is null;
