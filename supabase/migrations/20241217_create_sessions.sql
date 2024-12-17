-- Create sessions table for tracking user sessions
create table if not exists map_sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  metadata jsonb,
  status text not null default 'active',
  expires_at timestamp with time zone,
  
  constraint status_values check (status in ('active', 'expired', 'completed'))
);

-- Create index for faster lookups
create index if not exists idx_sessions_user_id on map_sessions(user_id);
create index if not exists idx_sessions_status on map_sessions(status);

-- Enable RLS
alter table map_sessions enable row level security;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous users to create sessions" ON map_sessions;
DROP POLICY IF EXISTS "Allow users to view their own sessions" ON map_sessions;
DROP POLICY IF EXISTS "Allow users to update their own sessions" ON map_sessions;

-- Create policies
create policy "Allow anonymous users to create sessions"
  on map_sessions for insert
  to anon, authenticated
  with check (true);

create policy "Allow users to view their own sessions"
  on map_sessions for select
  using (
    -- Allow if authenticated user owns the session
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Allow if session has no user_id (anonymous session)
    (user_id IS NULL)
  );

create policy "Allow users to update their own sessions"
  on map_sessions for update
  using (
    -- Allow if authenticated user owns the session
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Allow if session has no user_id (anonymous session)
    (user_id IS NULL)
  );

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_sessions_updated_at ON map_sessions;

-- Create trigger to automatically update updated_at
create trigger update_sessions_updated_at
  before update on map_sessions
  for each row
  execute function update_updated_at_column();
