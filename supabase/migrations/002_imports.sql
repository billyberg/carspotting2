-- Migration: import från gammal app
-- Kör i Supabase SQL Editor efter 001_avatars.sql.

-- 1. Startnummer på profiler
alter table profiles add column if not exists bootstrap_plate int not null default 0;

-- 2. Uppdatera sekvens-triggern så den tar hänsyn till bootstrap_plate
create or replace function enforce_plate_sequence()
returns trigger language plpgsql as $$
declare
  expected integer;
  max_find integer;
  boot integer;
begin
  select coalesce(max(plate_number), 0) into max_find
  from finds where profile_id = new.profile_id;

  select coalesce(bootstrap_plate, 0) into boot
  from profiles where id = new.profile_id;

  expected := greatest(max_find, boot) + 1;

  if new.plate_number <> expected then
    raise exception 'Nästa nummer måste vara %, inte %', expected, new.plate_number;
  end if;
  return new;
end;
$$;

-- 3. Uppdatera leaderboard-vyn
drop view if exists leaderboard;
create view leaderboard
with (security_invoker = true) as
select
  p.id,
  p.display_name,
  p.avatar_url,
  greatest(p.bootstrap_plate, coalesce(max(f.plate_number), 0)) as highest_plate,
  count(f.id)::int as total_finds,
  max(f.found_at) as last_find_at
from profiles p
left join finds f on f.profile_id = p.id
group by p.id, p.display_name, p.avatar_url, p.bootstrap_plate;

grant select on leaderboard to authenticated;

-- 4. Tabell för importerad data (email -> namn + startnummer)
create table if not exists pending_imports (
  email text primary key,
  display_name text not null,
  bootstrap_plate int not null default 0 check (bootstrap_plate >= 0),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table pending_imports add column if not exists avatar_url text;

alter table pending_imports enable row level security;

-- Inloggad användare kan bara se sin egen väntande import
drop policy if exists "pending_imports_select_own" on pending_imports;
create policy "pending_imports_select_own" on pending_imports
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 5. Funktion som skapar profil från en väntande import
create or replace function claim_import(p_display_name text default null)
returns profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_email text;
  v_import pending_imports;
  v_profile profiles;
  v_name text;
  v_boot int;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Inte inloggad';
  end if;

  -- Redan skapad profil?
  select * into v_profile from profiles where user_id = v_uid;
  if found then
    return v_profile;
  end if;

  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'Email saknas';
  end if;

  select * into v_import from pending_imports where lower(email) = v_email;

  if found then
    v_name := coalesce(nullif(trim(p_display_name), ''), v_import.display_name);
    v_boot := v_import.bootstrap_plate;
    insert into profiles (user_id, display_name, bootstrap_plate, avatar_url, is_fake)
    values (v_uid, v_name, v_boot, v_import.avatar_url, false)
    returning * into v_profile;
  else
    v_name := nullif(trim(p_display_name), '');
    if v_name is null then
      raise exception 'Ange ett namn';
    end if;
    insert into profiles (user_id, display_name, bootstrap_plate, is_fake)
    values (v_uid, v_name, 0, false)
    returning * into v_profile;
  end if;

  delete from pending_imports where lower(email) = v_email;

  return v_profile;
end;
$$;

grant execute on function claim_import(text) to authenticated;
