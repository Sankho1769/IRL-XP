-- IRL XP — 010_profile_theme_and_avatar.sql
-- Adds avatar_url and theme to profiles table.
-- Grants required permissions and RLS policies for own profile management.
-- Configures the avatars storage bucket with user-isolated RLS policies.

-- ============================================================
-- 1. Extend profiles table with avatar_url and theme
-- ============================================================
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists theme text not null default 'dark';

-- Ensure check constraint for theme values ('dark', 'crimson', 'arcane')
alter table public.profiles
  drop constraint if exists profiles_theme_check;

alter table public.profiles
  add constraint profiles_theme_check
  check (theme in ('dark', 'crimson', 'arcane'));

-- Set default for existing rows if null
update public.profiles
set theme = 'dark'
where theme is null;

-- ============================================================
-- 2. Ensure RLS is enabled and policies for profiles
-- ============================================================
alter table public.profiles enable row level security;

-- SELECT policy
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- UPDATE policy
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT policy (allows authenticated user to insert their own profile row if missing)
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Grants
grant select, insert, update on public.profiles to authenticated;

-- ============================================================
-- 3. Storage Bucket Configuration for User Avatars
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================
-- 4. Storage RLS Policies for Avatars Bucket
-- ============================================================
-- Public read access
drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated user upload into avatars/{user_id}/*
drop policy if exists "Authenticated users upload avatar" on storage.objects;
create policy "Authenticated users upload avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user update own avatar
drop policy if exists "Authenticated users update own avatar" on storage.objects;
create policy "Authenticated users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user delete own avatar
drop policy if exists "Authenticated users delete own avatar" on storage.objects;
create policy "Authenticated users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
