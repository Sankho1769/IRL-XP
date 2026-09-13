-- IRL XP — 006_custom_date_and_boss_quests.sql
-- Adds support for Custom Date Quick Quests and Boss Events with server-authoritative deadlines.

-- 1. Add new columns to quests table
alter table quests
  add column if not exists quest_type text not null default 'habit'
  check (quest_type in ('habit', 'boss')),
  add column if not exists deadline_at timestamptz null,
  add column if not exists bonus_xp_reward integer not null default 0
  check (bonus_xp_reward >= 0 and bonus_xp_reward <= 500),
  add column if not exists bonus_gold_reward integer not null default 0
  check (bonus_gold_reward >= 0 and bonus_gold_reward <= 250);

-- 2. Add check constraints
-- Constraint 1: Boss requires a deadline
alter table quests
  drop constraint if exists quests_boss_deadline_check;
alter table quests
  add constraint quests_boss_deadline_check
  check (quest_type <> 'boss' or deadline_at is not null);

-- Constraint 2: Boss must have frequency = 'once'
alter table quests
  drop constraint if exists quests_boss_frequency_check;
alter table quests
  add constraint quests_boss_frequency_check
  check (quest_type <> 'boss' or frequency = 'once');

-- Constraint 3: Deadline only for frequency = 'once'
alter table quests
  drop constraint if exists quests_deadline_frequency_check;
alter table quests
  add constraint quests_deadline_frequency_check
  check (deadline_at is null or frequency = 'once');

-- Constraint 4: Normal quests cannot have boss bonuses
alter table quests
  drop constraint if exists quests_normal_no_boss_bonus_check;
alter table quests
  add constraint quests_normal_no_boss_bonus_check
  check (quest_type = 'boss' or (bonus_xp_reward = 0 and bonus_gold_reward = 0));

-- 3. Update complete_quest(p_quest_id uuid) RPC
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
    'isBoss',            v_is_boss
  );
end;
$$;

revoke all on function complete_quest(uuid) from public;
grant execute on function complete_quest(uuid) to authenticated;

-- Ensure authenticated users have full CRUD permissions on quests
grant select, insert, update, delete
on public.quests
to authenticated;
