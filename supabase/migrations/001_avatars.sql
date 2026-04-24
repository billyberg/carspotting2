-- Migration: avatars
-- Kör i Supabase SQL Editor efter schema.sql.

-- 1. Kolumn för avatar-URL
alter table profiles add column if not exists avatar_url text;

-- 2. Storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Storage policies
-- Filer sparas som {profile_id}/avatar.{ext}

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Avatar insert own" on storage.objects;
create policy "Avatar insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid in (
      select id from profiles
      where user_id = auth.uid()
         or managed_by in (select id from profiles where user_id = auth.uid())
    )
  );

drop policy if exists "Avatar update own" on storage.objects;
create policy "Avatar update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid in (
      select id from profiles
      where user_id = auth.uid()
         or managed_by in (select id from profiles where user_id = auth.uid())
    )
  );

drop policy if exists "Avatar delete own" on storage.objects;
create policy "Avatar delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid in (
      select id from profiles
      where user_id = auth.uid()
         or managed_by in (select id from profiles where user_id = auth.uid())
    )
  );

-- 4. Uppdatera leaderboard-vyn så avatar_url kommer med
drop view if exists leaderboard;
create view leaderboard
with (security_invoker = true) as
select
  p.id,
  p.display_name,
  p.avatar_url,
  coalesce(max(f.plate_number), 0) as highest_plate,
  count(f.id)::int as total_finds,
  max(f.found_at) as last_find_at
from profiles p
left join finds f on f.profile_id = p.id
group by p.id, p.display_name, p.avatar_url;

grant select on leaderboard to authenticated;
