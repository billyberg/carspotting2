-- Platjakten schema
-- Run this once in Supabase SQL Editor after creating your project.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  is_fake boolean not null default false,
  managed_by uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_consistency check (
    (is_fake = false and user_id is not null and managed_by is null)
    or
    (is_fake = true and user_id is null and managed_by is not null)
  )
);

create unique index if not exists profiles_user_id_idx
  on profiles(user_id) where user_id is not null;

create table if not exists finds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plate_number integer not null check (plate_number >= 1),
  found_at timestamptz not null default now(),
  unique (profile_id, plate_number)
);

create index if not exists finds_profile_idx on finds(profile_id);

-- ============================================================
-- Sequence enforcement: plate N+1 can only be added if N exists
-- ============================================================

create or replace function enforce_plate_sequence()
returns trigger language plpgsql as $$
declare
  expected integer;
begin
  select coalesce(max(plate_number), 0) + 1 into expected
  from finds where profile_id = new.profile_id;
  if new.plate_number <> expected then
    raise exception 'Nästa nummer måste vara %, inte %', expected, new.plate_number;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_plate_sequence_trigger on finds;
create trigger enforce_plate_sequence_trigger
  before insert on finds
  for each row execute function enforce_plate_sequence();

-- Only allow deleting the latest find per profile (undo last)
create or replace function enforce_delete_latest()
returns trigger language plpgsql as $$
declare
  max_plate integer;
begin
  select max(plate_number) into max_plate
  from finds where profile_id = old.profile_id;
  if old.plate_number <> max_plate then
    raise exception 'Du kan bara ångra senaste fyndet';
  end if;
  return old;
end;
$$;

drop trigger if exists enforce_delete_latest_trigger on finds;
create trigger enforce_delete_latest_trigger
  before delete on finds
  for each row execute function enforce_delete_latest();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table finds enable row level security;

-- Profiles: everyone authenticated can read
drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles
  for select to authenticated using (true);

-- Insert: your own real profile, or a fake owned by you
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert to authenticated
  with check (
    (is_fake = false and user_id = auth.uid())
    or
    (is_fake = true
     and managed_by in (select id from profiles where user_id = auth.uid()))
  );

-- Update: your own profile or your fake profiles
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update to authenticated
  using (
    user_id = auth.uid()
    or managed_by in (select id from profiles where user_id = auth.uid())
  );

-- Delete: only fake profiles you manage
drop policy if exists "profiles_delete_own_fake" on profiles;
create policy "profiles_delete_own_fake" on profiles
  for delete to authenticated
  using (
    is_fake = true
    and managed_by in (select id from profiles where user_id = auth.uid())
  );

-- Finds: everyone can read
drop policy if exists "finds_select_all" on finds;
create policy "finds_select_all" on finds
  for select to authenticated using (true);

-- Insert finds for profiles you own
drop policy if exists "finds_insert_own" on finds;
create policy "finds_insert_own" on finds
  for insert to authenticated
  with check (
    profile_id in (
      select id from profiles
      where user_id = auth.uid()
         or managed_by in (select id from profiles where user_id = auth.uid())
    )
  );

-- Delete finds for profiles you own
drop policy if exists "finds_delete_own" on finds;
create policy "finds_delete_own" on finds
  for delete to authenticated
  using (
    profile_id in (
      select id from profiles
      where user_id = auth.uid()
         or managed_by in (select id from profiles where user_id = auth.uid())
    )
  );

-- ============================================================
-- Leaderboard view
-- ============================================================

create or replace view leaderboard
with (security_invoker = true) as
select
  p.id,
  p.display_name,
  coalesce(max(f.plate_number), 0) as highest_plate,
  count(f.id)::int as total_finds,
  max(f.found_at) as last_find_at
from profiles p
left join finds f on f.profile_id = p.id
group by p.id, p.display_name;

grant select on leaderboard to authenticated;
