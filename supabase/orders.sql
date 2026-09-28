-- Drop policies if they exist so the script is idempotent
drop policy if exists "Users can view their own orders" on orders;
drop policy if exists "Users can insert their own orders" on orders;
drop policy if exists "Users can view their own order items" on order_items;
drop policy if exists "Users can insert their own order items" on order_items;

-- Create tables
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  status text default 'processing',
  total_amount numeric default 0,
  shipping_address jsonb,
  payment_method text,
  payment_reference text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text,
  product_name text not null,
  product_image_url text,
  quantity int not null default 1,
  price numeric not null default 0,
  size text,
  color text
);

-- Enable RLS
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies for orders
create policy "Users can view their own orders" 
  on orders for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own orders" 
  on orders for insert 
  with check (auth.uid() = user_id);

-- Policies for order_items
create policy "Users can view their own order items" 
  on order_items for select 
  using (
    exists (
      select 1 from orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid()
    )
  );

create policy "Users can insert their own order items" 
  on order_items for insert 
  with check (
    exists (
      select 1 from orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid()
    )
  );

-- Reload schema
notify pgrst, 'reload schema';
