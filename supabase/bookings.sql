create table if not exists public.bookings (
  id text primary key,
  user_email text not null,
  user_name text not null,
  property text not null check (property in ('mysore', 'mahadevapura')),
  room_type_slug text not null,
  room_id text not null,
  check_in date not null,
  check_out date not null,
  adults integer not null default 1,
  children integer not null default 0,
  rooms_count integer not null default 1,
  guest_details jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bookings_property_dates_idx
  on public.bookings (property, check_in, check_out);

alter table public.bookings enable row level security;

-- Prototype policy: allows browser/server code using the publishable key to read/write bookings.
-- Tighten this before production by adding authenticated roles and per-user/admin policies.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'Allow prototype booking access'
  ) then
    create policy "Allow prototype booking access"
      on public.bookings
      for all
      using (true)
      with check (true);
  end if;
end $$;
