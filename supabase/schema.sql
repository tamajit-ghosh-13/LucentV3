-- Run once in Supabase SQL Editor before deploying Lucent.
create table if not exists public.extension_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.extension_events (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  site text not null,
  action text not null,
  feature text not null
);
alter table public.extension_settings enable row level security;
alter table public.extension_events enable row level security;
create policy "users manage their Lucent settings" on public.extension_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their Lucent events" on public.extension_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
