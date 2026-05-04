-- ===============================================
-- ReWear — profile avatars + display name editing
-- Date: 2026-05-04
--
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
-- ===============================================

-- ============= Profile column =============

alter table profiles
  add column avatar_url text;

-- ============= Storage bucket for profile photos =============

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Folder convention: profile-photos/{user_id}/{file}
create policy "users upload own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read is the default for public buckets, but make it explicit.
create policy "anyone reads profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- ============= Done =============
