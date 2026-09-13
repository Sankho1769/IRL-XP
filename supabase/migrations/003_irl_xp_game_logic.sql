-- IRL XP — P0 authoritative game logic
-- Two SECURITY DEFINER RPCs: complete_quest, purchase_item.
-- No schema changes. No RLS changes. No frontend. No dependencies.

-- ============================================================
-- complete_quest(p_quest_id uuid)
-- ============================================================
create or replace function complete_quest(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id       uuid := auth.uid();
  v_quest         quests%rowtype;
  v_character     characters%rowtype;
  v_today         date;
  v_week_start    date;
  v_already_done  boolean;
  v_old_level     integer;
  v_new_level     integer;
  v_did_level_up  boolean;
  v_new_streak    integer;
  v_new_xp        integer;
  v_new_gold      integer;
  v_attr_key      text;
  v_new_attrs     jsonb;
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

  v_new_xp   := v_character.xp + v_quest.xp_reward;
  v_new_gold := v_character.gold + v_quest.gold_reward;

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
    'success',      true,
    'xpAwarded',    v_quest.xp_reward,
    'goldAwarded',  v_quest.gold_reward,
    'newTotalXp',   v_character.xp,
    'oldLevel',     v_old_level,
    'newLevel',     v_character.level,
    'didLevelUp',   v_did_level_up,
    'streak',       v_character.streak_count,
    'attributes',   v_character.attributes,
    'attributeKey', v_attr_key
  );
end;
$$;

revoke all on function complete_quest(uuid) from public;
grant execute on function complete_quest(uuid) to authenticated;

-- ============================================================
-- purchase_item(p_item_id uuid)
-- ============================================================
create or replace function purchase_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id       uuid := auth.uid();
  v_item          shop_items%rowtype;
  v_character     characters%rowtype;
  v_already_owned boolean;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select * into v_item
  from shop_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if not v_item.active then
    raise exception 'INVALID_ITEM';
  end if;

  select exists (
    select 1 from user_inventory
    where user_id = v_user_id
      and item_id = p_item_id
  ) into v_already_owned;

  if v_already_owned then
    raise exception 'ALREADY_OWNED';
  end if;

  select * into v_character
  from characters
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'CHARACTER_NOT_FOUND';
  end if;

  if v_character.gold < v_item.price then
    raise exception 'INSUFFICIENT_GOLD';
  end if;

  update characters
  set gold = gold - v_item.price
  where user_id = v_user_id
  returning * into v_character;

  insert into user_inventory (user_id, item_id)
  values (v_user_id, p_item_id);

  return jsonb_build_object(
    'success',       true,
    'itemId',        v_item.id,
    'itemName',      v_item.name,
    'pricePaid',     v_item.price,
    'remainingGold', v_character.gold
  );
end;
$$;

revoke all on function purchase_item(uuid) from public;
grant execute on function purchase_item(uuid) to authenticated;
