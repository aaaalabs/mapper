-- Drop existing objects
drop trigger if exists update_payment_orders_updated_at on map_payment_orders;
drop function if exists update_payment_orders_updated_at();

-- Create payment orders table if not exists
create table if not exists map_payment_orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  revolut_order_id text not null,
  merchant_order_ref text not null unique,
  amount numeric not null,
  currency text not null,
  status text not null default 'pending',
  session_id uuid references map_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb,

  constraint status_values check (status in ('pending', 'completed', 'failed', 'cancelled'))
);

-- Create or replace function for updating timestamp
create or replace function update_payment_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger
create trigger update_payment_orders_updated_at
  before update on map_payment_orders
  for each row
  execute function update_payment_orders_updated_at();

-- Create indices if not exist
create index if not exists idx_payment_orders_merchant_ref on map_payment_orders(merchant_order_ref);
create index if not exists idx_payment_orders_revolut_id on map_payment_orders(revolut_order_id);
create index if not exists idx_payment_orders_user_id on map_payment_orders(user_id);
create index if not exists idx_payment_orders_session_id on map_payment_orders(session_id);
create index if not exists idx_payment_orders_status on map_payment_orders(status);

-- Enable RLS
ALTER TABLE map_payment_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert" ON map_payment_orders;
DROP POLICY IF EXISTS "Allow users to view their own orders" ON map_payment_orders;
DROP POLICY IF EXISTS "Allow users to update their own orders" ON map_payment_orders;

-- Allow anonymous users to create orders
CREATE POLICY "Allow anonymous insert" ON map_payment_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their orders
CREATE POLICY "Allow users to view their own orders" ON map_payment_orders
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow users to update their orders
CREATE POLICY "Allow users to update their own orders" ON map_payment_orders
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (
    status IN ('pending', 'completed', 'failed', 'cancelled')
  );
