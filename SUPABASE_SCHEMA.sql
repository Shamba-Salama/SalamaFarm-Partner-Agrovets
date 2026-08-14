-- ============================================================================
-- SALAMAFARM SUPABASE SCHEMA - COMPLETE & WORKING SQL
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- 1) Enable required extensions
create extension if not exists pgcrypto;

-- ============================================================================
-- 2) CREATE TABLES
-- ============================================================================

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

-- Stores table
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  town text not null default '',
  county text not null default '',
  till text not null default '',
  attendant_phone text not null default '',
  latitude numeric null,
  longitude numeric null,
  paystack_subaccount_code text null,
  open boolean not null default true,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products table
create table if not exists public.products (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  description text not null default '',
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  expiry date null,
  image_emoji text not null default '📦',
  image text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customers table
create table if not exists public.customers (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null,
  last_order_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, phone)
);

-- Orders table
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id bigint null references public.customers(id) on delete set null,
  customer_name text not null default '',
  customer_phone text not null default '',
  amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'Pending',
  pickup text not null default 'Awaiting Pickup',
  order_type text not null default 'counter',
  channel text not null default 'Marketplace',
  payment_status text not null default 'pending',
  mpesa_code text null,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items table
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint null references public.products(id) on delete set null,
  product_name text not null,
  qty integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Threads table (for messaging)
create table if not exists public.threads (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_name text not null default '',
  customer_phone text not null default '',
  unread integer not null default 0,
  last_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  thread_id bigint not null references public.threads(id) on delete cascade,
  sender text not null check (sender in ('customer', 'store')),
  text text not null default '',
  created_at timestamptz not null default now()
);

-- App visits table
create table if not exists public.app_visits (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  visits integer not null default 0,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  unique (store_id, day)
);

-- ============================================================================
-- 3) CREATE INDEXES
-- ============================================================================

create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_customers_store_id on public.customers(store_id);
create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_threads_store_id on public.threads(store_id);
create index if not exists idx_messages_thread_id on public.messages(thread_id);
create index if not exists idx_app_visits_store_id on public.app_visits(store_id);

-- ============================================================================
-- 4) CREATE TRIGGERS FOR AUTOMATIC PROFILE & UPDATED_AT
-- ============================================================================

-- Trigger: Create profile when new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone)
  values (new.id, new.email, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Trigger: Update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_stores on public.stores;
create trigger set_updated_at_stores
before update on public.stores
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_customers on public.customers;
create trigger set_updated_at_customers
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_orders on public.orders;
create trigger set_updated_at_orders
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_threads on public.threads;
create trigger set_updated_at_threads
before update on public.threads
for each row
execute function public.set_updated_at();

-- ============================================================================
-- 5) ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.app_visits enable row level security;

-- ============================================================================
-- 6) CREATE RLS POLICIES (FIXED - allows registration)
-- ============================================================================

-- PROFILES
create policy "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles are editable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- STORES - FIXED: Allow insert for authenticated users (registration)
create policy "Stores are viewable by owner"
on public.stores for select
using (auth.uid() = owner_id);

create policy "Stores are insertable by authenticated users"
on public.stores for insert
with check (auth.uid() = owner_id);

create policy "Stores are editable by owner"
on public.stores for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- PRODUCTS
create policy "Products are viewable by store owner"
on public.products for select
using (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Products are insertable by store owner"
on public.products for insert
with check (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Products are editable by store owner"
on public.products for update
using (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.owner_id = auth.uid()
  )
);

-- CUSTOMERS
create policy "Customers are viewable by store owner"
on public.customers for select
using (
  exists (
    select 1 from public.stores s
    where s.id = customers.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Customers are insertable by store owner"
on public.customers for insert
with check (
  exists (
    select 1 from public.stores s
    where s.id = customers.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Customers are editable by store owner"
on public.customers for update
using (
  exists (
    select 1 from public.stores s
    where s.id = customers.store_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = customers.store_id
      and s.owner_id = auth.uid()
  )
);

-- ORDERS
create policy "Orders are viewable by store owner"
on public.orders for select
using (
  exists (
    select 1 from public.stores s
    where s.id = orders.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Orders are insertable by store owner"
on public.orders for insert
with check (
  exists (
    select 1 from public.stores s
    where s.id = orders.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Orders are editable by store owner"
on public.orders for update
using (
  exists (
    select 1 from public.stores s
    where s.id = orders.store_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = orders.store_id
      and s.owner_id = auth.uid()
  )
);

-- ORDER ITEMS
create policy "Order items are viewable by store owner"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.id = order_items.order_id
      and s.owner_id = auth.uid()
  )
);

create policy "Order items are insertable by store owner"
on public.order_items for insert
with check (
  exists (
    select 1
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.id = order_items.order_id
      and s.owner_id = auth.uid()
  )
);

create policy "Order items are editable by store owner"
on public.order_items for update
using (
  exists (
    select 1
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.id = order_items.order_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.id = order_items.order_id
      and s.owner_id = auth.uid()
  )
);

-- THREADS
create policy "Threads are viewable by store owner"
on public.threads for select
using (
  exists (
    select 1 from public.stores s
    where s.id = threads.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Threads are insertable by store owner"
on public.threads for insert
with check (
  exists (
    select 1 from public.stores s
    where s.id = threads.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "Threads are editable by store owner"
on public.threads for update
using (
  exists (
    select 1 from public.stores s
    where s.id = threads.store_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = threads.store_id
      and s.owner_id = auth.uid()
  )
);

-- MESSAGES
create policy "Messages are viewable by store owner"
on public.messages for select
using (
  exists (
    select 1
    from public.threads t
    join public.stores s on s.id = t.store_id
    where t.id = messages.thread_id
      and s.owner_id = auth.uid()
  )
);

create policy "Messages are insertable by store owner"
on public.messages for insert
with check (
  exists (
    select 1
    from public.threads t
    join public.stores s on s.id = t.store_id
    where t.id = messages.thread_id
      and s.owner_id = auth.uid()
  )
);

create policy "Messages are editable by store owner"
on public.messages for update
using (
  exists (
    select 1
    from public.threads t
    join public.stores s on s.id = t.store_id
    where t.id = messages.thread_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.threads t
    join public.stores s on s.id = t.store_id
    where t.id = messages.thread_id
      and s.owner_id = auth.uid()
  )
);

-- APP VISITS
create policy "App visits are viewable by store owner"
on public.app_visits for select
using (
  exists (
    select 1 from public.stores s
    where s.id = app_visits.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "App visits are insertable by store owner"
on public.app_visits for insert
with check (
  exists (
    select 1 from public.stores s
    where s.id = app_visits.store_id
      and s.owner_id = auth.uid()
  )
);

create policy "App visits are editable by store owner"
on public.app_visits for update
using (
  exists (
    select 1 from public.stores s
    where s.id = app_visits.store_id
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = app_visits.store_id
      and s.owner_id = auth.uid()
  )
);

-- ============================================================================
-- 7) DONE!
-- ============================================================================
-- Your schema is ready. All tables are created with proper RLS policies.
-- Users can now register and their data will be secure and isolated.
--
-- PASSWORD RESET (built into Supabase Auth — no extra tables)
-- Dashboard → Authentication → URL Configuration:
--   Site URL: your deployed app origin (e.g. https://your-app.vercel.app)
--   Redirect URLs — add all of these:
--     http://localhost:8080/reset-password
--     http://localhost:8080/**
--     https://*.vercel.app/reset-password
--     https://YOUR-PRODUCTION-DOMAIN/reset-password
-- Dashboard → Authentication → Emails:
--   Keep the "Reset password" template enabled so users receive the link.

