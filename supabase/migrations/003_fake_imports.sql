-- Migration: import av fake-profiler (hanterade av en riktig användare via email)
-- Kör i Supabase SQL Editor efter 002_imports.sql.

-- 1. Tabell för väntande fake-profiler (länkad till hanterare via email)
create table if not exists pending_fake_imports (
  id uuid primary key default gen_random_uuid(),
  manager_email text not null,
  display_name text not null,
  bootstrap_plate int not null default 0 check (bootstrap_plate >= 0),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table pending_fake_imports enable row level security;
-- Inga RLS-policies = ingen vanlig user kan läsa/skriva.
-- Åtkomst sker bara via service role (SQL Editor) eller SECURITY DEFINER-funktioner.

-- 2. Funktion som skapar väntande fakes för en given hanterare
create or replace function flush_pending_fakes(p_email text)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_manager_id uuid;
  v_count int;
begin
  select p.id into v_manager_id
  from profiles p
  join auth.users u on u.id = p.user_id
  where lower(u.email) = lower(p_email)
    and p.is_fake = false;

  if v_manager_id is null then
    return 0;
  end if;

  insert into profiles (managed_by, display_name, bootstrap_plate, avatar_url, is_fake)
  select v_manager_id, display_name, bootstrap_plate, avatar_url, true
  from pending_fake_imports
  where lower(manager_email) = lower(p_email);

  get diagnostics v_count = row_count;

  delete from pending_fake_imports
  where lower(manager_email) = lower(p_email);

  return v_count;
end;
$$;

grant execute on function flush_pending_fakes(text) to authenticated;

-- 3. Uppdatera claim_import så den även flushar fakes automatiskt vid första login
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
    delete from pending_imports where lower(email) = v_email;
  else
    v_name := nullif(trim(p_display_name), '');
    if v_name is null then
      raise exception 'Ange ett namn';
    end if;
    insert into profiles (user_id, display_name, bootstrap_plate, is_fake)
    values (v_uid, v_name, 0, false)
    returning * into v_profile;
  end if;

  perform flush_pending_fakes(v_email);

  return v_profile;
end;
$$;
