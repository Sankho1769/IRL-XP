-- IRL XP — 009_profile_customization.sql
-- Adds avatar_url and theme to profiles table.
-- Configures storage bucket and RLS policies for user avatars.

-- 1. Extend profiles table with avatar_url and theme
alter table profiles
  add column if not exists avatar_url text,
  add column if not exists theme text not null default 'dark'
  check (theme in ('dark', 'crimson', 'arcane'));

-- 2. Storage bucket for user avatars (idempotent setup)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 3. Storage RLS Policies
-- Allow public read of avatars
drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar into avatars/{user_id}/*
drop policy if exists "Authenticated users upload avatar" on storage.objects;
create policy "Authenticated users upload avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users update own avatar" on storage.objects;
create policy "Authenticated users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users delete own avatar" on storage.objects;
create policy "Authenticated users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
