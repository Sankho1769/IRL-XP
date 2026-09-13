-- IRL XP — 008_deadline_penalties.sql
-- Adds server-authoritative missed-deadline penalty system and quest progress tracking.

-- 1. quests.progress
-- Represents the quest's integrity/momentum toward deadline completion (0 to 100).
-- Default 100 on creation.
-- This represents quest integrity, NOT the player's global XP or character level.
-- Never modifies global character XP or level.
alter table quests
  add column if not exists progress integer not null default 100
  check (progress >= 0 and progress <= 100);

-- 2. quest_deadline_penalties table
-- Authoritative persistent audit table recording applied penalties.
-- Enforces UNIQUE (user_id, quest_id) to guarantee a fixed-deadline quest is penalized exactly once.
create table if not exists quest_deadline_penalties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  penalty_days integer not null check (penalty_days >= 1),
  penalty_amount integer not null check (penalty_amount in (15, 20, 25)),
  processed_at timestamptz not null default now(),
  unique (user_id, quest_id)
);

create index if not exists quest_deadline_penalties_user_idx
  on quest_deadline_penalties(user_id);

create index if not exists quest_deadline_penalties_quest_idx
  on quest_deadline_penalties(quest_id);

-- 3. Row Level Security
alter table quest_deadline_penalties enable row level security;

drop policy if exists "Users can view own deadline penalties" on quest_deadline_penalties;
create policy "Users can view own deadline penalties"
  on quest_deadline_penalties
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 4. Grants
grant select on public.quest_deadline_penalties to authenticated;

-- 5. PostgreSQL RPC: process_deadline_penalties()
-- Server-authoritative function that derives user_id from auth.uid() (never trusts client user_id).
-- Checks calendar days late using Asia/Kolkata timezone.
-- Rules:
--   0 calendar days late: No penalty (same calendar day)
--   1 calendar day late:  -15 progress
--   2 calendar days late: -20 progress
--   3+ calendar days late: -25 progress
-- Progress clamped at 0: GREATEST(progress - penalty, 0).
-- Returns JSONB array of newly processed penalties only.
create or replace function process_deadline_penalties()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id             uuid := auth.uid();
  v_today_kolkata       date;
  v_overdue_record      record;
  v_days_late           integer;
  v_penalty             integer;
  v_new_progress        integer;
  v_processed_penalties jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  v_today_kolkata := (now() at time zone 'Asia/Kolkata')::date;

  -- Select active quests belonging to the caller with a fixed deadline that has elapsed,
  -- excluding completed quests and quests already penalized.
  for v_overdue_record in
    select q.id, q.title, q.deadline_at, q.progress, q.quest_type
    from quests q
    where q.user_id = v_user_id
      and q.active = true
      and q.deadline_at is not null
      and now() >= q.deadline_at
      and not exists (
        select 1 from quest_completions qc
        where qc.quest_id = q.id
          and qc.user_id = v_user_id
      )
      and not exists (
        select 1 from quest_deadline_penalties qdp
        where qdp.quest_id = q.id
          and qdp.user_id = v_user_id
      )
    for update of q
  loop
    -- Calendar-day difference in Asia/Kolkata
    v_days_late := v_today_kolkata - (v_overdue_record.deadline_at at time zone 'Asia/Kolkata')::date;

    -- Only apply penalty if at least 1 calendar day late
    if v_days_late >= 1 then
      if v_days_late = 1 then
        v_penalty := 15;
      elsif v_days_late = 2 then
        v_penalty := 20;
      else
        v_penalty := 25;
      end if;

      -- Penalty record acts as the idempotency gate: only the transaction that claims the penalty modifies progress
      insert into quest_deadline_penalties (
        user_id,
        quest_id,
        penalty_days,
        penalty_amount,
        processed_at
      )
      values (
        v_user_id,
        v_overdue_record.id,
        v_days_late,
        v_penalty,
        now()
      )
      on conflict (user_id, quest_id) do nothing;

      -- Check if row was newly inserted (claimed)
      if found then
        -- Progress clamped at zero (never negative, does not touch character XP or level)
        v_new_progress := greatest(v_overdue_record.progress - v_penalty, 0);

        update quests
        set progress = v_new_progress
        where id = v_overdue_record.id;

        v_processed_penalties := v_processed_penalties || jsonb_build_object(
          'questId', v_overdue_record.id,
          'questTitle', v_overdue_record.title,
          'daysLate', v_days_late,
          'penaltyAmount', v_penalty,
          'isBoss', (v_overdue_record.quest_type = 'boss'),
          'newProgress', v_new_progress
        );
      end if;
    end if;
  end loop;

  return v_processed_penalties;
end;
$$;

revoke all on function process_deadline_penalties() from public;
grant execute on function process_deadline_penalties() to authenticated;
