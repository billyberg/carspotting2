-- Fix: tvetydig profile_id i admin_user_list

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
      coalesce((select max(f.plate_number) from finds f where f.profile_id = p.id), 0)
    )::int,
    coalesce((select count(*) from finds f where f.profile_id = p.id), 0)::int,
    p.created_at
  from profiles p
  left join auth.users u on u.id = p.user_id
  where p.is_fake = false

  union all

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
      coalesce((select max(f.plate_number) from finds f where f.profile_id = p.id), 0)
    )::int,
    coalesce((select count(*) from finds f where f.profile_id = p.id), 0)::int,
    p.created_at
  from profiles p
  left join profiles m on m.id = p.managed_by
  where p.is_fake = true

  union all

  select
    'pending'::text,
    null::uuid,
    pi.email,
    pi.display_name,
    null::text,
    false,
    pi.avatar_url,
    pi.bootstrap_plate,
    pi.bootstrap_plate,
    0,
    pi.created_at
  from pending_imports pi

  union all

  select
    'pending-fake'::text,
    null::uuid,
    null::text,
    pf.display_name,
    pf.manager_email,
    false,
    pf.avatar_url,
    pf.bootstrap_plate,
    pf.bootstrap_plate,
    0,
    pf.created_at
  from pending_fake_imports pf

  order by 1, 11;
end;
$$;
