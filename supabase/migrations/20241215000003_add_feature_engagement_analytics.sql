-- Create map_features table to track available features
create table if not exists map_features (
    id uuid primary key default uuid_generate_v4(),
    feature_id text not null unique,
    feature_name text not null,
    description text,
    category text,
    created_at timestamp with time zone default now()
);

-- Create map_feature_events table to track feature usage
create table if not exists map_feature_events (
    id uuid primary key default uuid_generate_v4(),
    feature_id text not null references map_features(feature_id),
    user_id uuid references auth.users(id),
    session_id text not null,
    event_type text not null, -- 'start', 'complete', 'error'
    duration integer, -- in seconds
    metadata jsonb,
    timestamp timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create map_feature_metrics table for aggregated metrics
create table if not exists map_feature_metrics (
    id uuid primary key default uuid_generate_v4(),
    feature_id text not null references map_features(feature_id),
    date date not null,
    total_uses integer default 0,
    unique_users integer default 0,
    avg_duration numeric(10,2) default 0,
    success_rate numeric(5,4) default 0,
    created_at timestamp with time zone default now(),
    unique(feature_id, date)
);

-- Create indexes
create index if not exists idx_map_feature_events_feature_id on map_feature_events(feature_id);
create index if not exists idx_map_feature_events_user_id on map_feature_events(user_id);
create index if not exists idx_map_feature_events_timestamp on map_feature_events(timestamp);
create index if not exists idx_map_feature_metrics_feature_date on map_feature_metrics(feature_id, date);

-- Add RLS policies
alter table map_features enable row level security;
alter table map_feature_events enable row level security;
alter table map_feature_metrics enable row level security;

create policy "Allow admin to read map_features"
    on map_features for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

create policy "Allow admin to read map_feature_events"
    on map_feature_events for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

create policy "Allow admin to read map_feature_metrics"
    on map_feature_metrics for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

-- Function to update feature metrics
create or replace function update_map_feature_metrics()
returns trigger as $$
declare
    metric_date date;
    total_events integer;
    unique_users_count integer;
    avg_dur numeric(10,2);
    success_count integer;
    total_completed integer;
begin
    metric_date := date(new.timestamp);
    
    -- Get metrics for the day
    select 
        count(*),
        count(distinct user_id),
        coalesce(avg(duration), 0)
    into
        total_events,
        unique_users_count,
        avg_dur
    from map_feature_events
    where feature_id = new.feature_id
    and date(timestamp) = metric_date;

    -- Calculate success rate
    select 
        count(*),
        count(*) filter (where event_type = 'complete')
    into
        total_completed,
        success_count
    from map_feature_events
    where feature_id = new.feature_id
    and date(timestamp) = metric_date
    and event_type in ('complete', 'error');

    -- Insert or update metrics
    insert into map_feature_metrics (
        feature_id,
        date,
        total_uses,
        unique_users,
        avg_duration,
        success_rate
    )
    values (
        new.feature_id,
        metric_date,
        total_events,
        unique_users_count,
        avg_dur,
        case when total_completed > 0 
            then (success_count::numeric / total_completed::numeric)
            else 0 
        end
    )
    on conflict (feature_id, date)
    do update set
        total_uses = excluded.total_uses,
        unique_users = excluded.unique_users,
        avg_duration = excluded.avg_duration,
        success_rate = excluded.success_rate;

    return new;
end;
$$ language plpgsql;

create trigger update_map_feature_metrics_trigger
    after insert on map_feature_events
    for each row
    execute function update_map_feature_metrics();

-- Insert initial features
insert into map_features (feature_id, feature_name, description, category) values
    ('map_create', 'Create Map', 'Create a new map', 'core'),
    ('map_edit', 'Edit Map', 'Edit an existing map', 'core'),
    ('map_share', 'Share Map', 'Share map with others', 'sharing'),
    ('map_download', 'Download Map', 'Download map as image', 'export'),
    ('map_style', 'Style Map', 'Customize map appearance', 'customization'),
    ('add_marker', 'Add Marker', 'Add marker to map', 'markers'),
    ('edit_marker', 'Edit Marker', 'Edit existing marker', 'markers'),
    ('delete_marker', 'Delete Marker', 'Remove marker from map', 'markers')
on conflict (feature_id) do nothing;
