-- Create analytics table
create table map_analytics (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  maps_created integer default 0,
  views integer not null default 0,
  shares integer default 0,
  user_id uuid references auth.users(id),
  load_time float,
  errors integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  avg_session_duration float null,
  last_viewed_at timestamp with time zone null,
  engagement_score float null,
  error_count integer not null default 0
);

-- Add new columns to existing analytics table
alter table public.map_analytics
  add column if not exists views integer not null default 0,
  add column if not exists avg_session_duration float null,
  add column if not exists last_viewed_at timestamp with time zone null,
  add column if not exists engagement_score float null,
  add column if not exists error_count integer not null default 0;

-- Create indexes for better query performance
create index if not exists idx_analytics_date on map_analytics(date);
create index if not exists idx_analytics_user on map_analytics(user_id);
create index if not exists idx_map_analytics_created_at on public.map_analytics(created_at);
create index if not exists idx_map_analytics_views on public.map_analytics(views);
