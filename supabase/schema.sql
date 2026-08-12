-- VANASURU Retreat Planner - Complete Production Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create public.users table (Account storage)
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  password text not null,
  name text not null,
  role text not null check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

-- 2. Create public.locations table (Property storage)
create table if not exists public.locations (
  id text primary key,
  key text unique not null,
  name text not null,
  address text not null,
  phone text not null,
  email text not null,
  tagline text not null,
  photos jsonb default '[]'::jsonb,
  map_embed_url text,
  created_at timestamptz not null default now()
);

-- 3. Create public.rooms table (Physical room assignments)
create table if not exists public.rooms (
  id text primary key,
  name text not null,
  property text not null references public.locations(key) on delete cascade,
  room_type_slug text not null,
  advance_amount numeric not null default 1000,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. Create public.bookings table (Reservations storage)
create table if not exists public.bookings (
  id text primary key,
  user_email text not null,
  user_name text not null,
  property text not null,
  room_type_slug text not null,
  room_id text not null,
  check_in text not null,
  check_out text not null,
  adults integer not null default 1,
  children integer not null default 0,
  rooms_count integer not null default 1,
  guest_details jsonb not null,
  status text not null check (status in ('pending', 'confirmed', 'cancelled')),
  payment jsonb,
  created_at timestamptz not null default now()
);

-- 5. Create public.events table (Resort events & function hall offerings)
create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null,
  property text not null,
  venue text not null,
  date text not null,
  capacity integer not null default 100,
  price numeric not null default 0,
  image text not null,
  photos jsonb default '[]'::jsonb,
  is_highlighted boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. Create public.event_bookings table (Client event & function hall reservations)
create table if not exists public.event_bookings (
  id text primary key,
  event_id text,
  event_title text not null,
  property text not null,
  venue text not null,
  user_email text not null,
  user_name text not null,
  event_date text not null,
  guests_count integer not null default 1,
  guest_details jsonb not null,
  status text not null check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS) on all tables
alter table public.users enable row level security;
alter table public.locations enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.events enable row level security;
alter table public.event_bookings enable row level security;

-- Setup policies for application access
drop policy if exists "Allow users access" on public.users;
create policy "Allow users access" on public.users for all using (true) with check (true);

drop policy if exists "Allow locations access" on public.locations;
create policy "Allow locations access" on public.locations for all using (true) with check (true);

drop policy if exists "Allow rooms access" on public.rooms;
create policy "Allow rooms access" on public.rooms for all using (true) with check (true);

drop policy if exists "Allow bookings access" on public.bookings;
create policy "Allow bookings access" on public.bookings for all using (true) with check (true);

drop policy if exists "Allow events access" on public.events;
create policy "Allow events access" on public.events for all using (true) with check (true);

drop policy if exists "Allow event_bookings access" on public.event_bookings;
create policy "Allow event_bookings access" on public.event_bookings for all using (true) with check (true);

-- Indexes for optimal query performance
create index if not exists idx_bookings_user_email on public.bookings(user_email);
create index if not exists idx_bookings_property on public.bookings(property);
create index if not exists idx_rooms_property on public.rooms(property);
create index if not exists idx_events_property on public.events(property);
create index if not exists idx_event_bookings_user_email on public.event_bookings(user_email);

-- Seed default admin and client accounts
insert into public.users (id, email, password, name, role)
values 
  ('u-admin', 'vanasurumys@gmail.com', 'vanasuru', 'VANASURU Admin', 'admin'),
  ('u-client1', 'guest@vanasuru.com', 'guest123', 'Guest User', 'client')
on conflict (id) do update set email = excluded.email, password = excluded.password, name = excluded.name, role = excluded.role;

-- Seed default locations
insert into public.locations (id, key, name, address, phone, email, tagline, map_embed_url)
values
  ('loc-mysore', 'mysore', 'VANASURU Silverleaf', 'Vanasuru, 227/9, CFTRI layout, Bogadi 2nd Stage, Bogadi, Mysuru, Karnataka 570022', '+91 78991 79979', 'vanasurumys@gmail.com', 'A serene nature retreat wrapped in gardens and gentle mornings.', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2753.269961454444!2d76.60362042044873!3d12.298387815407652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baf7b7ec30ea817%3A0xf60112f9c3cfbb4c!2sVanasuru!5e0!3m2!1sen!2sin!4v1785132467896!5m2!1sen!2sin'),
  ('loc-mahadevapura', 'mahadevapura', 'VANASURU Village', 'Mahadevapura, Mysuru, Karnataka 571438 (12.3993043, 76.7884710)', '+91 78991 79979', 'vanasurumys@gmail.com', 'Modern luxury for business, celebrations, and the city''s finer moments.', 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3896.755266672102!2d76.7859033750668!3d12.39930998786595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTLCsDIzJzU3LjUiTiA3NsKwNDcnMTguNSJF!5e0!3m2!1sen!2sin!4v1785132548332!5m2!1sen!2sin')
on conflict (key) do nothing;

-- Migration statements for dynamic room columns
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS advance_amount numeric not null default 1000;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS photos jsonb default '[]'::jsonb;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS max_guests integer default 4;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS max_adults integer default 2;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS max_kids integer default 1;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS bed_type text default 'King Bed';



