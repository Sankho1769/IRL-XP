"use server";

import { createClient } from "@/lib/supabase/server";
import type { UnlockedAchievement } from "./achievements";

export type Quest = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: "strength" | "intelligence" | "discipline" | "health" | "creativity";
  xp_reward: number;
  gold_reward: number;
  frequency: "daily" | "weekly" | "once";
  quest_type: "habit" | "boss";
  deadline_at: string | null;
  bonus_xp_reward: number;
  bonus_gold_reward: number;
  progress: number;
  penalty?: {
    daysLate: number;
    penaltyAmount: number;
    processedAt: string;
  } | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompleteQuestResult = {
  success: boolean;
  xpAwarded: number;
  goldAwarded: number;
  bonusXpAwarded: number;
  bonusGoldAwarded: number;
  newTotalXp: number;
  oldLevel: number;
  newLevel: number;
  didLevelUp: boolean;
  streak: number;
  attributes: Record<string, number>;
  attributeKey: string;
  isBoss: boolean;
  newAchievements?: UnlockedAchievement[];
};

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

const VALID_CATEGORIES = ["strength", "intelligence", "discipline", "health", "creativity"];
const VALID_FREQUENCIES = ["daily", "weekly", "once"];

// Maps a raised Postgres exception message to one of our known
// application-level error codes. Anything unrecognized collapses to
// DATABASE_ERROR rather than leaking a raw Postgres message to the client.
function mapRpcError(message: string): string {
  const known = [
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "INVALID_QUEST",
    "ALREADY_COMPLETED",
    "CHARACTER_NOT_FOUND",
    "EXPIRED",
    "BOSS_EXPIRED",
  ];
  return known.includes(message) ? message : "DATABASE_ERROR";
}

export type ProcessedPenalty = {
  questId: string;
  questTitle: string;
  daysLate: number;
  penaltyAmount: number;
  isBoss: boolean;
  newProgress: number;
};

export async function getQuests(): Promise<ActionResult<Quest[]>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  // RLS already scopes this to the caller's own rows; no .eq needed,
  // but it costs nothing to be explicit and it documents the intent.
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getQuests] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: "DATABASE_ERROR" };
  }

  // Authoritatively load processed penalties for the user
  const { data: penalties } = await supabase
    .from("quest_deadline_penalties")
    .select("quest_id, penalty_days, penalty_amount, processed_at")
    .eq("user_id", user.id);

  const penaltyMap = new Map<
    string,
    { daysLate: number; penaltyAmount: number; processedAt: string }
  >();
  if (penalties) {
    for (const p of penalties) {
      penaltyMap.set(p.quest_id, {
        daysLate: p.penalty_days,
        penaltyAmount: p.penalty_amount,
        processedAt: p.processed_at,
      });
    }
  }

  const questsWithPenalties: Quest[] = (data ?? []).map((q: any) => ({
    ...q,
    progress: q.progress !== undefined && q.progress !== null ? q.progress : 100,
    penalty: penaltyMap.get(q.id) ?? null,
  }));

  return { data: questsWithPenalties };
}

export async function processDeadlinePenalties(): Promise<ActionResult<ProcessedPenalty[]>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { data, error } = await supabase.rpc("process_deadline_penalties");

  if (error) {
    console.error("[processDeadlinePenalties] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: "DATABASE_ERROR" };
  }

  return { data: (data as ProcessedPenalty[]) ?? [] };
}

export type QuestCompletion = {
  id: string;
  quest_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
};

export async function getQuestCompletions(): Promise<ActionResult<QuestCompletion[]>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { data, error } = await supabase
    .from("quest_completions")
    .select("*")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("[getQuestCompletions] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: "DATABASE_ERROR" };
  }
  return { data: (data as QuestCompletion[]) ?? [] };
}

export async function createQuest(input: {
  title: string;
  description?: string;
  category: string;
  xp_reward: number;
  gold_reward: number;
  frequency: string;
  quest_type?: "habit" | "boss";
  deadline_at?: string | null;
  bonus_xp_reward?: number;
  bonus_gold_reward?: number;
}): Promise<ActionResult<Quest>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  if (!input.title || input.title.trim().length === 0 || input.title.length > 200) {
    return { error: "INVALID_INPUT" };
  }
  if (!VALID_CATEGORIES.includes(input.category)) {
    return { error: "INVALID_INPUT" };
  }
  if (!VALID_FREQUENCIES.includes(input.frequency)) {
    return { error: "INVALID_INPUT" };
  }
  if (input.xp_reward < 0 || input.xp_reward > 100) {
    return { error: "INVALID_INPUT" };
  }
  if (input.gold_reward < 0 || input.gold_reward > 50) {
    return { error: "INVALID_INPUT" };
  }

  const questType = input.quest_type ?? "habit";
  const bonusXp = input.bonus_xp_reward ?? 0;
  const bonusGold = input.bonus_gold_reward ?? 0;
  const deadlineAt = input.deadline_at ?? null;

  if (!["habit", "boss"].includes(questType)) {
    return { error: "INVALID_INPUT" };
  }
  if (bonusXp < 0 || bonusXp > 500) {
    return { error: "INVALID_INPUT" };
  }
  if (bonusGold < 0 || bonusGold > 250) {
    return { error: "INVALID_INPUT" };
  }

  if (deadlineAt !== null) {
    const deadlineMs = new Date(deadlineAt).getTime();
    if (isNaN(deadlineMs) || deadlineMs <= Date.now()) {
      return { error: "INVALID_DEADLINE" };
    }
  }

  if (questType === "boss") {
    if (input.frequency !== "once") return { error: "INVALID_INPUT" };
    if (!deadlineAt) return { error: "INVALID_DEADLINE" };
  } else {
    if (bonusXp !== 0 || bonusGold !== 0) return { error: "INVALID_INPUT" };
    if (deadlineAt && input.frequency !== "once") return { error: "INVALID_INPUT" };
  }

  const { data, error } = await supabase
    .from("quests")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description ?? null,
      category: input.category,
      xp_reward: input.xp_reward,
      gold_reward: input.gold_reward,
      frequency: input.frequency,
      quest_type: questType,
      deadline_at: deadlineAt,
      bonus_xp_reward: bonusXp,
      bonus_gold_reward: bonusGold,
    })
    .select()
    .single();

  if (error) {
    console.error("[createQuest] Supabase insert failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    // Check for schema drift / missing migration 006 columns
    if (error.code === "42703" || error.code === "PGRST204") {
      console.error(
        "[createQuest] Column missing in quests table. Schema drift detected: migration 006_custom_date_and_boss_quests.sql must be applied."
      );
      return { error: "MIGRATION_REQUIRED" };
    }

    // PostgreSQL check constraint violations (23514)
    if (error.code === "23514") {
      const msg = (error.message || "").toLowerCase();
      const det = (error.details || "").toLowerCase();
      if (msg.includes("deadline") || det.includes("deadline")) {
        return { error: "INVALID_DEADLINE" };
      }
      return { error: "INVALID_INPUT" };
    }

    // Not-null or foreign key violation
    if (error.code === "23502" || error.code === "23503") {
      return { error: "INVALID_INPUT" };
    }

    // Datetime syntax/overflow
    if (error.code === "22007" || error.code === "22008") {
      return { error: "INVALID_DEADLINE" };
    }

    // Auth / Permissions failures (42501 permission_denied or PGRST301 jwt_expired)
    if (error.code === "42501" || error.code === "PGRST301") {
      return { error: "UNAUTHENTICATED" };
    }

    return { error: "DATABASE_ERROR" };
  }
  return { data: data as Quest };
}

export async function updateQuest(
  questId: string,
  input: Partial<{
    title: string;
    description: string | null;
    category: string;
    xp_reward: number;
    gold_reward: number;
    frequency: string;
    quest_type: "habit" | "boss";
    deadline_at: string | null;
    bonus_xp_reward: number;
    bonus_gold_reward: number;
    active: boolean;
  }>
): Promise<ActionResult<Quest>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  // 1. Load the existing quest first to validate merged state
  const { data: existing, error: fetchError } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) return { error: "NOT_FOUND" };

  // 2. Merge existing + incoming values
  const mergedTitle = input.title !== undefined ? input.title.trim() : existing.title;
  const mergedCategory = input.category ?? existing.category;
  const mergedFrequency = input.frequency ?? existing.frequency;
  const mergedXp = input.xp_reward !== undefined ? input.xp_reward : existing.xp_reward;
  const mergedGold = input.gold_reward !== undefined ? input.gold_reward : existing.gold_reward;
  const mergedQuestType = input.quest_type ?? existing.quest_type ?? "habit";
  const mergedDeadlineAt = input.deadline_at !== undefined ? input.deadline_at : existing.deadline_at;
  const mergedBonusXp = input.bonus_xp_reward !== undefined ? input.bonus_xp_reward : (existing.bonus_xp_reward ?? 0);
  const mergedBonusGold = input.bonus_gold_reward !== undefined ? input.bonus_gold_reward : (existing.bonus_gold_reward ?? 0);

  // 3. Validate merged fields
  if (!mergedTitle || mergedTitle.length === 0 || mergedTitle.length > 200) {
    return { error: "INVALID_INPUT" };
  }
  if (!VALID_CATEGORIES.includes(mergedCategory)) {
    return { error: "INVALID_INPUT" };
  }
  if (!VALID_FREQUENCIES.includes(mergedFrequency)) {
    return { error: "INVALID_INPUT" };
  }
  if (mergedXp < 0 || mergedXp > 100) {
    return { error: "INVALID_INPUT" };
  }
  if (mergedGold < 0 || mergedGold > 50) {
    return { error: "INVALID_INPUT" };
  }
  if (!["habit", "boss"].includes(mergedQuestType)) {
    return { error: "INVALID_INPUT" };
  }
  if (mergedBonusXp < 0 || mergedBonusXp > 500) {
    return { error: "INVALID_INPUT" };
  }
  if (mergedBonusGold < 0 || mergedBonusGold > 250) {
    return { error: "INVALID_INPUT" };
  }

  // 4. Validate deadline on the FINAL merged state
  if (mergedDeadlineAt !== null) {
    const deadlineMs = new Date(mergedDeadlineAt).getTime();
    if (isNaN(deadlineMs) || deadlineMs <= Date.now()) {
      return { error: "INVALID_DEADLINE" };
    }
  }

  // 5. Validate composite rules on merged state
  if (mergedQuestType === "boss") {
    if (mergedFrequency !== "once") return { error: "INVALID_INPUT" };
    if (!mergedDeadlineAt) return { error: "INVALID_DEADLINE" };
  } else {
    if (mergedBonusXp !== 0 || mergedBonusGold !== 0) return { error: "INVALID_INPUT" };
    if (mergedDeadlineAt && mergedFrequency !== "once") return { error: "INVALID_INPUT" };
  }

  // .eq("user_id", user.id) here is a belt-and-suspenders check — RLS's
  // WITH CHECK already prevents updating a row that isn't the caller's.
  const { data, error } = await supabase
    .from("quests")
    .update(input)
    .eq("id", questId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return { error: "NOT_FOUND" };
    console.error("[updateQuest] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: "DATABASE_ERROR" };
  }
  return { data: data as Quest };
}

export async function deleteQuest(
  questId: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { error } = await supabase
    .from("quests")
    .delete()
    .eq("id", questId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteQuest] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: "DATABASE_ERROR" };
  }
  return { data: { id: questId } };
}

/**
 * The only way a quest completion happens. Sends nothing but the quest
 * ID — every reward value, the streak, the level, and the attribute
 * change are calculated inside complete_quest() in Postgres, not here.
 */
export async function completeQuest(
  questId: string
): Promise<ActionResult<CompleteQuestResult>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { data, error } = await supabase.rpc("complete_quest", {
    p_quest_id: questId,
  });

  if (error) {
    console.error("[completeQuest] Supabase RPC error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: mapRpcError(error.message) };
  }
  return { data: data as CompleteQuestResult };
}
