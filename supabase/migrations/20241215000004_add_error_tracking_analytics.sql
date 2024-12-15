-- Create map_error_events table
create table if not exists map_error_events (
    id uuid primary key default uuid_generate_v4(),
    error_type text not null,
    error_message text,
    stack_trace text,
    user_id uuid references auth.users(id),
    session_id text,
    browser text,
    os text,
    url text,
    component text,
    severity text check (severity in ('low', 'medium', 'high', 'critical')),
    status text check (status in ('new', 'investigating', 'resolved')),
    resolved_at timestamp with time zone,
    timestamp timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create map_performance_metrics table
create table if not exists map_performance_metrics (
    id uuid primary key default uuid_generate_v4(),
    metric_type text not null,
    value numeric not null,
    user_id uuid references auth.users(id),
    session_id text,
    url text,
    component text,
    browser text,
    os text,
    timestamp timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);

-- Create map_system_health_metrics table for aggregated metrics
create table if not exists map_system_health_metrics (
    id uuid primary key default uuid_generate_v4(),
    date date not null,
    error_count integer default 0,
    avg_response_time numeric(10,2) default 0,
    p95_response_time numeric(10,2) default 0,
    p99_response_time numeric(10,2) default 0,
    success_rate numeric(5,4) default 0,
    memory_usage numeric(10,2) default 0,
    cpu_usage numeric(5,2) default 0,
    created_at timestamp with time zone default now(),
    unique(date)
);

-- Create indexes
create index if not exists idx_map_error_events_timestamp on map_error_events(timestamp);
create index if not exists idx_map_error_events_error_type on map_error_events(error_type);
create index if not exists idx_map_error_events_severity on map_error_events(severity);
create index if not exists idx_map_error_events_status on map_error_events(status);
create index if not exists idx_map_performance_metrics_timestamp on map_performance_metrics(timestamp);
create index if not exists idx_map_performance_metrics_metric_type on map_performance_metrics(metric_type);
create index if not exists idx_map_system_health_metrics_date on map_system_health_metrics(date);

-- Add RLS policies
alter table map_error_events enable row level security;
alter table map_performance_metrics enable row level security;
alter table map_system_health_metrics enable row level security;

create policy "Allow admin to read map_error_events"
    on map_error_events for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

create policy "Allow admin to read map_performance_metrics"
    on map_performance_metrics for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

create policy "Allow admin to read map_system_health_metrics"
    on map_system_health_metrics for select
    to authenticated
    using (auth.jwt() ->> 'email' = 'admin@libralab.ai');

-- Function to update system health metrics
create or replace function update_map_system_health_metrics()
returns trigger as $$
declare
    metric_date date;
    total_requests integer;
    error_requests integer;
    avg_resp numeric(10,2);
    p95_resp numeric(10,2);
    p99_resp numeric(10,2);
begin
    metric_date := date(new.timestamp);
    
    -- Calculate metrics for the day
    with response_times as (
        select value
        from map_performance_metrics
        where metric_type = 'response_time'
        and date(timestamp) = metric_date
        order by value
    ),
    total_counts as (
        select count(*) as total,
            count(*) filter (where value > 1000) as errors -- Response times over 1s considered errors
        from map_performance_metrics
        where metric_type = 'response_time'
        and date(timestamp) = metric_date
    ),
    percentiles as (
        select
            percentile_cont(0.95) within group (order by value) as p95,
            percentile_cont(0.99) within group (order by value) as p99
        from response_times
    )
    select
        avg(m.value),
        p.p95,
        p.p99,
        c.total,
        c.errors
    into
        avg_resp,
        p95_resp,
        p99_resp,
        total_requests,
        error_requests
    from map_performance_metrics m
    cross join percentiles p
    cross join total_counts c
    where m.metric_type = 'response_time'
    and date(m.timestamp) = metric_date;

    -- Get error count
    select count(*)
    into error_requests
    from map_error_events
    where date(timestamp) = metric_date;

    -- Insert or update metrics
    insert into map_system_health_metrics (
        date,
        error_count,
        avg_response_time,
        p95_response_time,
        p99_response_time,
        success_rate,
        memory_usage,
        cpu_usage
    )
    values (
        metric_date,
        error_requests,
        coalesce(avg_resp, 0),
        coalesce(p95_resp, 0),
        coalesce(p99_resp, 0),
        case 
            when total_requests > 0 
            then 1 - (error_requests::numeric / total_requests::numeric)
            else 1 
        end,
        (select coalesce(avg(value), 0) from map_performance_metrics 
         where metric_type = 'memory_usage' and date(timestamp) = metric_date),
        (select coalesce(avg(value), 0) from map_performance_metrics 
         where metric_type = 'cpu_usage' and date(timestamp) = metric_date)
    )
    on conflict (date)
    do update set
        error_count = excluded.error_count,
        avg_response_time = excluded.avg_response_time,
        p95_response_time = excluded.p95_response_time,
        p99_response_time = excluded.p99_response_time,
        success_rate = excluded.success_rate,
        memory_usage = excluded.memory_usage,
        cpu_usage = excluded.cpu_usage;

    return new;
end;
$$ language plpgsql;

create trigger update_map_system_health_metrics_trigger
    after insert on map_performance_metrics
    for each row
    execute function update_map_system_health_metrics();
