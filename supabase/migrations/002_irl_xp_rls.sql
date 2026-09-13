-- IRL XP — P0 Row Level Security
-- Applies to the six tables created in 001_irl_xp_schema.sql.

-- ============================================================
-- 1. profiles
-- ============================================================
alter table profiles enable row level security;

create policy profiles_select_own
  on profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy profiles_update_own
  on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No client INSERT policy. New profiles are created by the
-- SECURITY DEFINER auth trigger in 001.

-- ============================================================
-- 2. characters
-- ============================================================
alter table characters enable row level security;

create policy characters_select_own
  on characters
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for authenticated.
-- Progression changes only through authoritative server-side RPCs.

-- ============================================================
-- 3. quests — full CRUD, own rows only
-- ============================================================
alter table quests enable row level security;

create policy quests_select_own
  on quests
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy quests_insert_own
  on quests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy quests_update_own
  on quests
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy quests_delete_own
  on quests
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 4. quest_completions
-- ============================================================
alter table quest_completions enable row level security;

create policy quest_completions_select_own
  on quest_completions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policy.
-- Completion rows are created only by complete_quest().

-- ============================================================
-- 5. shop_items — authenticated users can read active catalog only
-- ============================================================
alter table shop_items enable row level security;

create policy shop_items_select_active
  on shop_items
  for select
  to authenticated
  using (active = true);

-- No client INSERT/UPDATE/DELETE policy.

-- ============================================================
-- 6. user_inventory
-- ============================================================
alter table user_inventory enable row level security;

create policy user_inventory_select_own
  on user_inventory
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policy.
-- Ownership is created only by purchase_item().
