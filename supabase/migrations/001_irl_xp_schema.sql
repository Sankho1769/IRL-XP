-- IRL XP — P0 schema migration
-- Scope: profiles, characters, quests, quest_completions, shop_items, user_inventory
-- P0 only. RLS is applied in 002_irl_xp_rls.sql.

create extension if not exists pgcrypto;

-- ============================================================
-- Shared: generic updated_at trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. profiles — one row per auth user
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- 2. characters — exactly one per user
-- ============================================================
create table characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  gold integer not null default 0 check (gold >= 0),
  attributes jsonb not null default '{
    "strength": 0,
    "intelligence": 0,
    "discipline": 0,
    "health": 0,
    "creativity": 0
  }'::jsonb,
  streak_count integer not null default 0 check (streak_count >= 0),
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index characters_user_id_idx on characters(user_id);

create trigger characters_set_updated_at
  before update on characters
  for each row execute function set_updated_at();

-- ============================================================
-- Centralized leveling formula
-- ============================================================
create or replace function xp_required_for_level(target_level integer)
returns integer
language sql
immutable
as $$
  select round(100 * power(target_level::numeric, 1.5))::integer;
$$;

-- ============================================================
-- 3. quests
-- ============================================================
create table quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  category text not null check (
    category in ('strength', 'intelligence', 'discipline', 'health', 'creativity')
  ),
  xp_reward integer not null default 10 check (xp_reward >= 0),
  gold_reward integer not null default 5 check (gold_reward >= 0),
  frequency text not null default 'daily' check (
    frequency in ('daily', 'weekly', 'once')
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quests_user_id_idx on quests(user_id);
create index quests_user_active_idx on quests(user_id, active);

create trigger quests_set_updated_at
  before update on quests
  for each row execute function set_updated_at();

-- ============================================================
-- 4. quest_completions
-- ============================================================
create table quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completion_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (quest_id, user_id, completion_date)
);

create index quest_completions_user_date_idx
  on quest_completions(user_id, completion_date);

-- ============================================================
-- 5. shop_items — static catalog
-- ============================================================
create table shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text,
  price integer not null check (price >= 0),
  type text not null check (
    type in ('theme', 'avatar', 'badge', 'title', 'cosmetic')
  ),
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. user_inventory — ownership records
-- ============================================================
create table user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references shop_items(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index user_inventory_user_id_idx on user_inventory(user_id);

-- ============================================================
-- New-user initialization
-- Creates profile + character whenever Supabase Auth creates a user.
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Player'
    )
  );

  insert into characters (user_id)
  values (new.id);

  return new;
end;
$$;

revoke all on function handle_new_user() from public;
revoke all on function handle_new_user() from anon;
revoke all on function handle_new_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
