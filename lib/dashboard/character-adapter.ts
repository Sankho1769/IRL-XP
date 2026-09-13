// lib/dashboard/character-adapter.ts
//
// Frontend-only adapter. Maps the authoritative data shapes returned by
// app/actions/{character,quests,shop}.ts into the presentation contract
// in types/dashboard.ts, so the polished dashboard components never see
// raw database rows.
//
// This file does NOT decide game rules. It does not grant XP, change
// level, award gold, or persist anything. complete_quest() and
// purchase_item() in Postgres remain the only source of truth for all
// of that. This file only reshapes already-decided data for display.

import type { Character } from "@/app/actions/character";
import type { Quest as DbQuest } from "@/app/actions/quests";
import type { ShopItem as DbShopItem } from "@/app/actions/shop";
import type {
  AttributeKey,
  Player,
  Quest,
  ShopItem,
} from "@/types/dashboard";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "strength",
  "intelligence",
  "discipline",
  "health",
  "creativity",
];

/**
 * Mirrors `xp_required_for_level()` from
 * supabase/migrations/001_irl_xp_schema.sql:
 *
 *   select round(100 * power(target_level::numeric, 1.5))::integer;
 *
 * This is a read-only, display-only reimplementation used to compute
 * progress within the current level for the XP bar.
 *
 * It must never be treated as authoritative. If the backend formula
 * ever changes, this needs to be updated to match, but it never feeds
 * anything back into the database.
 */
function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/** Character (database row) -> Player (presentation contract). */
export function characterToPlayer(
  character: Character,
  displayName: string,
  avatarUrl: string | null = null
): Player {
  // Level 1 starts at 0 cumulative XP.
  //
  // For later levels, the current level begins at the XP threshold
  // defined by the same formula used by the authoritative database
  // function.
  const currentLevelBase =
    character.level === 1
      ? 0
      : xpRequiredForLevel(character.level);

  const nextLevelThreshold =
    xpRequiredForLevel(character.level + 1);

  const attributes = ATTRIBUTE_KEYS.reduce((acc, key) => {
    acc[key] = character.attributes?.[key] ?? 0;
    return acc;
  }, {} as Record<AttributeKey, number>);

  return {
    id: character.id,
    name: displayName,
    title: `Level ${character.level} Adventurer`,
    avatarUrl,
    level: character.level,

    // currentXP / xpToNextLevel are progress-within-level for the
    // XP bar only. character.xp remains the player's real cumulative
    // lifetime XP and is never changed by this adapter.
    currentXP: Math.max(
      0,
      character.xp - currentLevelBase
    ),
    xpToNextLevel: Math.max(
      1,
      nextLevelThreshold - currentLevelBase
    ),

    gold: character.gold,
    streakDays: character.streak_count,
    attributes,
  };
}

/** Database quest row -> presentation Quest, with completion state supplied by the caller. */
export function dbQuestToPresentation(
  quest: DbQuest,
  completed: boolean
): Quest {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description ?? "",
    category: quest.category,
    xpReward: quest.xp_reward,
    goldReward: quest.gold_reward,
    frequency: quest.frequency,
    completed,
    questType: quest.quest_type ?? "habit",
    deadlineAt: quest.deadline_at ?? null,
    bonusXpReward: quest.bonus_xp_reward ?? 0,
    bonusGoldReward: quest.bonus_gold_reward ?? 0,
    progress: quest.progress ?? 100,
    penalty: quest.penalty ?? null,
  };
}

/**
 * Checks if a quest with a deadline has expired based on current time.
 */
export function isQuestExpired(
  quest: { deadlineAt?: string | null; deadline_at?: string | null },
  nowMs: number = Date.now()
): boolean {
  const deadline = quest.deadlineAt ?? quest.deadline_at;
  if (!deadline) return false;
  return new Date(deadline).getTime() <= nowMs;
}

/**
 * PRESENTATION ONLY helper for missed deadline information.
 * Calculates calendar days late in Asia/Kolkata timezone.
 * Must NEVER apply real penalties — PostgreSQL RPC process_deadline_penalties()
 * is the sole authoritative source of truth.
 */
export function getMissedDeadlineInfo(
  quest: {
    deadlineAt?: string | null;
    deadline_at?: string | null;
    penalty?: { daysLate: number; penaltyAmount: number } | null;
  },
  nowMs: number = Date.now()
): {
  isMissed: boolean;
  daysLate: number;
  penaltyAmount: number;
} {
  const deadline = quest.deadlineAt ?? quest.deadline_at;
  if (!deadline) {
    return { isMissed: false, daysLate: 0, penaltyAmount: 0 };
  }

  // If already recorded authoritatively in database
  if (quest.penalty) {
    return {
      isMissed: true,
      daysLate: quest.penalty.daysLate,
      penaltyAmount: quest.penalty.penaltyAmount,
    };
  }

  const deadlineMs = new Date(deadline).getTime();
  if (deadlineMs > nowMs) {
    return { isMissed: false, daysLate: 0, penaltyAmount: 0 };
  }

  // Calculate calendar days in Asia/Kolkata
  try {
    const nowKolkata = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(nowMs));

    const deadlineKolkata = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(deadlineMs));

    const nowDate = new Date(nowKolkata);
    const deadlineDate = new Date(deadlineKolkata);
    const diffDays = Math.max(
      0,
      Math.round((nowDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    let penalty = 0;
    if (diffDays === 1) penalty = 15;
    else if (diffDays === 2) penalty = 20;
    else if (diffDays >= 3) penalty = 25;

    return {
      isMissed: diffDays >= 1,
      daysLate: diffDays,
      penaltyAmount: penalty,
    };
  } catch {
    return { isMissed: false, daysLate: 0, penaltyAmount: 0 };
  }
}

function iconForShopItemType(type: DbShopItem["type"]): string {
  switch (type) {
    case "theme":
      return "Palette";

    case "avatar":
      return "User";

    case "badge":
      return "Shield";

    case "title":
      return "Crown";

    case "cosmetic":
    default:
      return "Sparkles";
  }
}

/** Database shop_items row -> presentation ShopItem, with ownership supplied by the caller. */
export function dbShopItemToPresentation(
  item: DbShopItem,
  owned: boolean
): ShopItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    icon: iconForShopItemType(item.type),
    owned,

    // shop_items.type is a plain `string` in the action's return type,
    // but the database check constraint guarantees it is one of the
    // supported values.
    category: item.type as ShopItem["category"],
  };
}

/**
 * Checks if a quest should currently be marked completed based on its frequency
 * and existing quest completion records (mirroring the logic in complete_quest() RPC).
 */
export function isQuestCompleted(
  quest: { id: string; frequency: string },
  completions: { quest_id: string; completion_date: string }[]
): boolean {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(now);

  const questCompletions = completions.filter((c) => c.quest_id === quest.id);
  if (questCompletions.length === 0) return false;

  if (quest.frequency === "once") {
    return true;
  }

  if (quest.frequency === "daily") {
    return questCompletions.some((c) => c.completion_date === todayStr);
  }

  if (quest.frequency === "weekly") {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);
    const y = parseInt(parts.find((p) => p.type === "year")?.value ?? "2026", 10);
    const m = parseInt(parts.find((p) => p.type === "month")?.value ?? "1", 10) - 1;
    const d = parseInt(parts.find((p) => p.type === "day")?.value ?? "1", 10);
    const dateObj = new Date(y, m, d);
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(y, m, diff);
    const nextMonday = new Date(y, m, diff + 7);
    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    const nextMondayStr = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, "0")}-${String(nextMonday.getDate()).padStart(2, "0")}`;
    return questCompletions.some(
      (c) => c.completion_date >= mondayStr && c.completion_date < nextMondayStr
    );
  }

  return false;
}