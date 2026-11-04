drop policy if exists "Users can view own wishlist" on wishlist;
drop policy if exists "Users can insert own wishlist" on wishlist;
drop policy if exists "Users can delete own wishlist" on wishlist;

create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table wishlist enable row level security;

create policy "Users can view own wishlist"
  on wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert own wishlist"
  on wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own wishlist"
  on wishlist for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
