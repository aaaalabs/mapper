# Mapper Database Schema Documentation

## Tables

### map_sessions
Tracks anonymous user sessions and their interactions.
```sql
create table map_sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active timestamp with time zone default timezone('utc'::text, now()) not null,
  client_info jsonb,
  is_anonymous boolean default true
);
```

### map_interactions
Records user interactions with maps.
```sql
create table map_interactions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references map_sessions(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  interaction_type text not null,
  map_id uuid,
  metadata jsonb
);
```

### map_settings
Stores map configuration and display settings.
```sql
create table map_settings (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  map_id uuid not null,
  settings jsonb not null,
  is_public boolean default false
);
```

### map_analytics
Tracks map usage and performance metrics.
```sql
create table map_analytics (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  map_id uuid not null,
  metric_type text not null,
  value numeric not null,
  metadata jsonb
);
```

## Views

### map_usage_stats
Aggregates map usage statistics for analytics.
```sql
create view map_usage_stats as
select
  map_id,
  count(distinct session_id) as unique_visitors,
  count(*) as total_interactions,
  max(created_at) as last_interaction
from map_interactions
group by map_id;
```

## Functions

### fn_update_last_active()
Updates the last_active timestamp for sessions.
```sql
create function fn_update_last_active()
returns trigger as $$
begin
  update map_sessions
  set last_active = now()
  where id = new.session_id;
  return new;
end;
$$ language plpgsql;
```

## Policies

### Anonymous Access Policies
```sql
-- Allow anonymous read access to public maps
create policy "Allow anonymous read access to public maps"
on map_settings for select
using (is_public = true);

-- Allow session creation for anonymous users
create policy "Allow session creation for anonymous users"
on map_sessions for insert
with check (is_anonymous = true);

-- Allow interaction tracking for existing sessions
create policy "Allow interaction tracking for existing sessions"
on map_interactions for insert
with check (session_id in (select id from map_sessions));
```

## Performance Considerations

1. Indexes
- Created indexes on frequently queried columns
- Used GiST indexes for geographic data
- B-tree indexes on foreign keys and timestamp columns

2. Partitioning
- Analytics table is partitioned by month for better query performance
- Automatic partition management through pg_cron

3. Maintenance
- Regular vacuum and analyze operations
- Monthly partition rotation for analytics data
- Quarterly review of unused indexes
