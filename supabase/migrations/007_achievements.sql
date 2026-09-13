-- IRL XP — 007_achievements.sql
-- Adds lightweight, server-authoritative Achievement / Trophy system.

-- 1. Table: achievement_definitions (Catalog of achievable trophies)
create table if not exists achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 1 and 50),
  name text not null check (char_length(name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 500),
  tier text not null check (tier in ('Bronze', 'Silver', 'Gold', 'Streak', 'Boss', 'Diamond', 'Legendary')),
  icon text not null check (char_length(icon) between 1 and 20),
  requirement_value integer not null default 0 check (requirement_value >= 0),
  created_at timestamptz not null default now()
);

-- 2. Table: user_achievements (User ownership & unlock timestamps)
create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievement_definitions(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists user_achievements_user_id_idx on user_achievements(user_id);
create index if not exists user_achievements_achievement_id_idx on user_achievements(achievement_id);

-- 3. Row Level Security
alter table achievement_definitions enable row level security;
alter table user_achievements enable row level security;

drop policy if exists "Authenticated users can view achievement definitions" on achievement_definitions;
create policy "Authenticated users can view achievement definitions"
  on achievement_definitions
  for select
  to authenticated
  using (true);

drop policy if exists "Users can view own achievements" on user_achievements;
create policy "Users can view own achievements"
  on user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 4. Grants
grant select on public.achievement_definitions to authenticated;
grant select on public.user_achievements to authenticated;

-- 5. Seed the 8 core milestone achievements
insert into achievement_definitions (code, name, description, tier, icon, requirement_value)
values
  ('FIRST_STEP', 'First Step', 'Complete 1 quest', 'Bronze', '🥉', 1),
  ('QUEST_HUNTER', 'Quest Hunter', 'Complete 10 quests', 'Silver', '🥈', 10),
  ('QUEST_MASTER', 'Quest Master', 'Complete 50 quests', 'Gold', '🥇', 50),
  ('FLAME_KEEPER', 'Flame Keeper', 'Reach a 7-day streak', 'Streak', '🔥', 7),
  ('BOSS_SLAYER', 'Boss Slayer', 'Defeat 1 Boss Event', 'Boss', '⚔️', 1),
  ('BOSS_CONQUEROR', 'Boss Conqueror', 'Defeat 10 Boss Events', 'Boss', '👑', 10),
  ('LEVEL_ASCENDANT', 'Level Ascendant', 'Reach Level 5', 'Diamond', '💎', 5),
  ('LEGEND', 'Legend', 'Reach Level 10', 'Legendary', '🏆', 10)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  tier = excluded.tier,
  icon = excluded.icon,
  requirement_value = excluded.requirement_value;

-- 6. Server-authoritative achievement verification helper
create or replace function check_and_unlock_achievements(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quest_count      integer := 0;
  v_boss_count       integer := 0;
  v_streak           integer := 0;
  v_level            integer := 1;
  v_eligible_codes   text[] := array[]::text[];
  v_new_achievements jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    return '[]'::jsonb;
  end if;

  -- Count total completed quests authoritatively from quest_completions
  select count(*) into v_quest_count
  from quest_completions
  where user_id = p_user_id;

  -- Count total completed Boss Events
  select count(*) into v_boss_count
  from quest_completions qc
  join quests q on qc.quest_id = q.id
  where qc.user_id = p_user_id
    and q.quest_type = 'boss';

  -- Read character streak and level
  select coalesce(streak_count, 0), coalesce(level, 1)
  into v_streak, v_level
  from characters
  where user_id = p_user_id;

  -- Determine eligibility against milestone thresholds
  if v_quest_count >= 1 then
    v_eligible_codes := array_append(v_eligible_codes, 'FIRST_STEP');
  end if;
  if v_quest_count >= 10 then
    v_eligible_codes := array_append(v_eligible_codes, 'QUEST_HUNTER');
  end if;
  if v_quest_count >= 50 then
    v_eligible_codes := array_append(v_eligible_codes, 'QUEST_MASTER');
  end if;
  if v_streak >= 7 then
    v_eligible_codes := array_append(v_eligible_codes, 'FLAME_KEEPER');
  end if;
  if v_boss_count >= 1 then
    v_eligible_codes := array_append(v_eligible_codes, 'BOSS_SLAYER');
  end if;
  if v_boss_count >= 10 then
    v_eligible_codes := array_append(v_eligible_codes, 'BOSS_CONQUEROR');
  end if;
  if v_level >= 5 then
    v_eligible_codes := array_append(v_eligible_codes, 'LEVEL_ASCENDANT');
  end if;
  if v_level >= 10 then
    v_eligible_codes := array_append(v_eligible_codes, 'LEGEND');
  end if;

  if coalesce(array_length(v_eligible_codes, 1), 0) = 0 then
    return '[]'::jsonb;
  end if;

  -- Atomically insert newly unlocked achievements only if not already owned
  with inserted as (
    insert into user_achievements (user_id, achievement_id)
    select p_user_id, ad.id
    from achievement_definitions ad
    where ad.code = any(v_eligible_codes)
      and not exists (
        select 1 from user_achievements ua
        where ua.user_id = p_user_id
          and ua.achievement_id = ad.id
      )
    on conflict (user_id, achievement_id) do nothing
    returning achievement_id, unlocked_at
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ad.id,
        'code', ad.code,
        'name', ad.name,
        'description', ad.description,
        'tier', ad.tier,
        'icon', ad.icon,
        'unlockedAt', ins.unlocked_at
      )
    ),
    '[]'::jsonb
  )
  into v_new_achievements
  from inserted ins
  join achievement_definitions ad on ins.achievement_id = ad.id;

  return coalesce(v_new_achievements, '[]'::jsonb);
end;
$$;

revoke all on function check_and_unlock_achievements(uuid) from public;
grant execute on function check_and_unlock_achievements(uuid) to authenticated;

-- 7. Update complete_quest(p_quest_id uuid) RPC to invoke achievement check
create or replace function complete_quest(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id             uuid := auth.uid();
  v_quest               quests%rowtype;
  v_character           characters%rowtype;
  v_today               date;
  v_week_start          date;
  v_already_done        boolean;
  v_old_level           integer;
  v_new_level           integer;
  v_did_level_up        boolean;
  v_new_streak          integer;
  v_xp_to_award         integer;
  v_gold_to_award       integer;
  v_bonus_xp_to_award   integer := 0;
  v_bonus_gold_to_award integer := 0;
  v_is_boss             boolean := false;
  v_new_xp              integer;
  v_new_gold            integer;
  v_attr_key            text;
  v_new_attrs           jsonb;
  v_new_achievements    jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  v_today := (now() at time zone 'Asia/Kolkata')::date;

  -- Serialize concurrent attempts against the same quest.
  select * into v_quest
  from quests
  where id = p_quest_id
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_quest.user_id <> v_user_id then
    raise exception 'FORBIDDEN';
  end if;

  if not v_quest.active then
    raise exception 'INVALID_QUEST';
  end if;

  if v_quest.frequency = 'daily' then
    select exists (
      select 1 from quest_completions
      where quest_id = p_quest_id
        and user_id = v_user_id
        and completion_date = v_today
    ) into v_already_done;

    if v_already_done then
      raise exception 'ALREADY_COMPLETED';
    end if;

  elsif v_quest.frequency = 'weekly' then
    v_week_start := date_trunc('week', v_today)::date;

    select exists (
      select 1 from quest_completions
      where quest_id = p_quest_id
        and user_id = v_user_id
        and completion_date >= v_week_start
        and completion_date < v_week_start + 7
    ) into v_already_done;

    if v_already_done then
      raise exception 'ALREADY_COMPLETED';
    end if;

  elsif v_quest.frequency = 'once' then
    select exists (
      select 1 from quest_completions
      where quest_id = p_quest_id
        and user_id = v_user_id
    ) into v_already_done;

    if v_already_done then
      raise exception 'ALREADY_COMPLETED';
    end if;

  else
    raise exception 'INVALID_QUEST';
  end if;

  -- Server-authoritative deadline check (only checked if quest has not already been completed)
  if v_quest.deadline_at is not null and now() >= v_quest.deadline_at then
    if v_quest.quest_type = 'boss' then
      raise exception 'BOSS_EXPIRED';
    else
      raise exception 'EXPIRED';
    end if;
  end if;

  -- Serialize all progression changes for this user.
  select * into v_character
  from characters
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'CHARACTER_NOT_FOUND';
  end if;

  insert into quest_completions (quest_id, user_id, completion_date)
  values (p_quest_id, v_user_id, v_today);

  v_old_level := v_character.level;

  if v_character.last_active_date is null then
    v_new_streak := 1;
  elsif v_character.last_active_date = v_today then
    v_new_streak := v_character.streak_count;
  elsif v_character.last_active_date = v_today - 1 then
    v_new_streak := v_character.streak_count + 1;
  else
    v_new_streak := 1;
  end if;

  v_attr_key := v_quest.category;

  v_new_attrs := jsonb_set(
    v_character.attributes,
    array[v_attr_key]::text[],
    to_jsonb(
      coalesce((v_character.attributes ->> v_attr_key)::integer, 0) + 1
    ),
    true
  );

  -- Calculate rewards (with Boss bonuses if applicable)
  if v_quest.quest_type = 'boss' then
    v_is_boss := true;
    v_bonus_xp_to_award := v_quest.bonus_xp_reward;
    v_bonus_gold_to_award := v_quest.bonus_gold_reward;
  end if;

  v_xp_to_award := v_quest.xp_reward + v_bonus_xp_to_award;
  v_gold_to_award := v_quest.gold_reward + v_bonus_gold_to_award;

  v_new_xp   := v_character.xp + v_xp_to_award;
  v_new_gold := v_character.gold + v_gold_to_award;

  v_new_level := v_old_level;

  while xp_required_for_level(v_new_level + 1) <= v_new_xp loop
    v_new_level := v_new_level + 1;
  end loop;

  v_did_level_up := v_new_level > v_old_level;

  update characters
  set
    xp               = v_new_xp,
    gold             = v_new_gold,
    level            = v_new_level,
    attributes       = v_new_attrs,
    streak_count     = v_new_streak,
    last_active_date = v_today
  where user_id = v_user_id
  returning * into v_character;

  -- Server-authoritative achievement verification after successful quest completion
  v_new_achievements := check_and_unlock_achievements(v_user_id);

  return jsonb_build_object(
    'success',           true,
    'xpAwarded',         v_xp_to_award,
    'goldAwarded',       v_gold_to_award,
    'bonusXpAwarded',    v_bonus_xp_to_award,
    'bonusGoldAwarded',  v_bonus_gold_to_award,
    'newTotalXp',        v_character.xp,
    'oldLevel',          v_old_level,
    'newLevel',          v_character.level,
    'didLevelUp',        v_did_level_up,
    'streak',            v_character.streak_count,
    'attributes',        v_character.attributes,
    'attributeKey',      v_attr_key,
    'isBoss',            v_is_boss,
    'newAchievements',   coalesce(v_new_achievements, '[]'::jsonb)
  );
end;
$$;

revoke all on function complete_quest(uuid) from public;
grant execute on function complete_quest(uuid) to authenticated;
