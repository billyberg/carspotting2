-- Migration: admin-roll och användarlista
-- Kör i Supabase SQL Editor efter 003_fake_imports.sql.

-- 1. Admin-flagga
alter table profiles add column if not exists is_admin boolean not null default false;

-- 2. Hjälpfunktion: är inloggad användare admin?
create or replace function is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and is_admin = true
  );
$$;

grant execute on function is_current_admin() to authenticated;

-- 3. Lista alla användare (registrerade, fakes, pending imports)
create or replace function admin_user_list()
returns table (
  kind text,
  profile_id uuid,
  email text,
  display_name text,
  manager_display_name text,
  is_admin boolean,
  avatar_url text,
  bootstrap_plate int,
  highest_plate int,
  total_finds int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not is_current_admin() then
    raise exception 'Inte admin';
  end if;

  return query
  -- Registrerade riktiga användare
  select
    'registered'::text,
    p.id,
    u.email::text,
    p.display_name,
    null::text,
    p.is_admin,
    p.avatar_url,
    p.bootstrap_plate,
    greatest(
      p.bootstrap_plate,
      coalesce((select max(plate_number) from finds where profile_id = p.id), 0)
    )::int,
    coalesce((select count(*) from finds where profile_id = p.id), 0)::int,
    p.created_at
  from profiles p
  left join auth.users u on u.id = p.user_id
  where p.is_fake = false

  union all

  -- Fake-profiler
  select
    'fake'::text,
    p.id,
    null::text,
    p.display_name,
    m.display_name,
    false,
    p.avatar_url,
    p.bootstrap_plate,
    greatest(
      p.bootstrap_plate,
      coalesce((select max(plate_number) from finds where profile_id = p.id), 0)
    )::int,
    coalesce((select count(*) from finds where profile_id = p.id), 0)::int,
    p.created_at
  from profiles p
  left join profiles m on m.id = p.managed_by
  where p.is_fake = true

  union all

  -- Väntande riktiga importer
  select
    'pending'::text,
    null::uuid,
    email,
    display_name,
    null::text,
    false,
    avatar_url,
    bootstrap_plate,
    bootstrap_plate,
    0,
    created_at
  from pending_imports

  union all

  -- Väntande fake-importer
  select
    'pending-fake'::text,
    null::uuid,
    null::text,
    display_name,
    manager_email,
    false,
    avatar_url,
    bootstrap_plate,
    bootstrap_plate,
    0,
    created_at
  from pending_fake_imports

  order by 1, 11;
end;
$$;

grant execute on function admin_user_list() to authenticated;
