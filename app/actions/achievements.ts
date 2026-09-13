"use server";

import { createClient } from "@/lib/supabase/server";

export type AchievementTier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Streak"
  | "Boss"
  | "Diamond"
  | "Legendary";

export type AchievementDefinition = {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  requirement_value: number;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};

export type AchievementWithStatus = {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  requirement_value: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
};

export type UnlockedAchievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: string;
  icon: string;
  unlockedAt: string;
};

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

const ORDERED_ACHIEVEMENT_CODES = [
  "FIRST_STEP",
  "QUEST_HUNTER",
  "QUEST_MASTER",
  "FLAME_KEEPER",
  "BOSS_SLAYER",
  "BOSS_CONQUEROR",
  "LEVEL_ASCENDANT",
  "LEGEND",
];

export async function getAchievements(): Promise<ActionResult<AchievementWithStatus[]>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "UNAUTHENTICATED" };
  }

  // 1. Fetch catalog of definitions
  const { data: definitions, error: defsError } = await supabase
    .from("achievement_definitions")
    .select("*");

  if (defsError) {
    console.error("[getAchievements] Failed to fetch achievement definitions:", {
      message: defsError.message,
      code: defsError.code,
      details: defsError.details,
      hint: defsError.hint,
    });
    // If table does not exist yet, degrade gracefully rather than throwing
    return { data: [] };
  }

  // 2. Fetch user's unlocked achievements
  const { data: userUnlocks, error: unlocksError } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", user.id);

  if (unlocksError) {
    console.error("[getAchievements] Failed to fetch user achievements:", {
      message: unlocksError.message,
      code: unlocksError.code,
      details: unlocksError.details,
      hint: unlocksError.hint,
    });
    return { data: [] };
  }

  const unlockMap = new Map<string, string>();
  for (const row of userUnlocks ?? []) {
    unlockMap.set(row.achievement_id, row.unlocked_at);
  }

  const merged: AchievementWithStatus[] = (definitions ?? []).map((def) => ({
    id: def.id,
    code: def.code,
    name: def.name,
    description: def.description,
    tier: def.tier as AchievementTier,
    icon: def.icon,
    requirement_value: def.requirement_value,
    isUnlocked: unlockMap.has(def.id),
    unlockedAt: unlockMap.get(def.id) ?? null,
  }));

  // Sort according to design sequence
  merged.sort((a, b) => {
    const idxA = ORDERED_ACHIEVEMENT_CODES.indexOf(a.code);
    const idxB = ORDERED_ACHIEVEMENT_CODES.indexOf(b.code);
    const orderA = idxA !== -1 ? idxA : 999;
    const orderB = idxB !== -1 ? idxB : 999;
    return orderA - orderB;
  });

  return { data: merged };
}
