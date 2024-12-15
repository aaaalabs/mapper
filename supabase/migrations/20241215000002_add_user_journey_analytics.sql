-- Create map_user_sessions table
create table if not exists map_user_sessions (
    id uuid primary key default uuid_generate_v4(),
    session_id text not null,
    user_id uuid references auth.users(id),
    start_time timestamp with time zone not null default now(),
    end_time timestamp with time zone,
    duration integer, -- in seconds
    is_bounce boolean default false,
    is_returning boolean default false,
    pages_viewed integer default 0,
    created_at timestamp with time zone default now()
);

-- Create map_user_journey_flow table
create table if not exists map_user_journey_flow (
    id uuid primary key default uuid_generate_v4(),
    session_id text not null,
    user_id uuid references auth.users(id),
    source_page text not null,
    target_page text not null,
    timestamp timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_map_user_sessions_session_id on map_user_sessions(session_id);
create index if not exists idx_map_user_sessions_user_id on map_user_sessions(user_id);
create index if not exists idx_map_user_sessions_start_time on map_user_sessions(start_time);
create index if not exists idx_map_user_journey_flow_session_id on map_user_journey_flow(session_id);
create index if not exists idx_map_user_journey_flow_timestamp on map_user_journey_flow(timestamp);

-- Add RLS policies
alter table map_user_sessions enable row level security;
alter table map_user_journey_flow enable row level security;

create policy "Allow admin to read map_user_sessions"
    on map_user_sessions for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

create policy "Allow admin to read map_user_journey_flow"
    on map_user_journey_flow for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

-- Functions to update session metrics
create or replace function update_map_session_duration()
returns trigger as $$
begin
    new.duration := extract(epoch from new.end_time - new.start_time)::integer;
    return new;
end;
$$ language plpgsql;

create trigger update_map_session_duration_trigger
    before update of end_time on map_user_sessions
    for each row
    when (old.end_time is null and new.end_time is not null)
    execute function update_map_session_duration();

-- Function to update pages viewed count
create or replace function increment_map_pages_viewed()
returns trigger as $$
begin
    update map_user_sessions
    set pages_viewed = pages_viewed + 1
    where session_id = new.session_id;
    return new;
end;
$$ language plpgsql;

create trigger increment_map_pages_viewed_trigger
    after insert on map_user_journey_flow
    for each row
    execute function increment_map_pages_viewed();
