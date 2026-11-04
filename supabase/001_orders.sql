-- Drop existing policies to ensure idempotency
drop policy if exists "Users can view their own orders" on orders;
drop policy if exists "Users can insert their own orders" on orders;
drop policy if exists "Users can view their own order items" on order_items;
drop policy if exists "Users can insert their own order items" on order_items;

-- Create tables
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null unique,
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric default 0,
  shipping_address jsonb,
  payment_method text,
  payment_reference text unique,
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

-- Keep only select-own policies (remove direct insert policies)
create policy "Users can view their own orders" 
  on orders for select 
  using (auth.uid() = user_id);

create policy "Users can view their own order items" 
  on order_items for select 
  using (
    exists (
      select 1 from orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid()
    )
  );

-- Reload schema cache
notify pgrst, 'reload schema';
