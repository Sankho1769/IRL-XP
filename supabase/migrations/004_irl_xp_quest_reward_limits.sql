-- IRL XP — P0 quest reward limits
-- Prevents users from creating quests with abusive XP/gold rewards.

-- Remove the original lower-bound-only checks.
alter table quests
  drop constraint if exists quests_xp_reward_check;

alter table quests
  drop constraint if exists quests_gold_reward_check;

-- Add bounded reward constraints.
alter table quests
  add constraint quests_xp_reward_check
  check (xp_reward >= 0 and xp_reward <= 100);

alter table quests
  add constraint quests_gold_reward_check
  check (gold_reward >= 0 and gold_reward <= 50);