-- Create push_tokens table
create table public.push_tokens (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  device_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint push_tokens_pkey primary key (id),
  constraint push_tokens_user_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint push_tokens_unique_user_token unique (user_id, token)
);

-- Create index for faster lookups
create index idx_push_tokens_user_id on public.push_tokens(user_id);
create index idx_push_tokens_token on public.push_tokens(token);

-- Enable RLS
alter table public.push_tokens enable row level security;

-- RLS policies
create policy "Users can view their own push tokens" on public.push_tokens
  for select using (auth.uid() = user_id);

create policy "Users can insert their own push tokens" on public.push_tokens
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own push tokens" on public.push_tokens
  for update using (auth.uid() = user_id);

create policy "Users can delete their own push tokens" on public.push_tokens
  for delete using (auth.uid() = user_id);