// types/dashboard.ts
//
// Shared shape for the IRL XP dashboard UI.
// These types describe the data the presentation layer expects.
// When backend integration lands, server actions should resolve to
// these same shapes (or a thin adapter should map to them) so none
// of the components below need to change.

export type AttributeKey =
  | "strength"
  | "intelligence"
  | "discipline"
  | "health"
  | "creativity";

export type QuestCategory =
  | "strength"
  | "intelligence"
  | "discipline"
  | "health"
  | "creativity";

export type QuestFrequency = "daily" | "weekly" | "once";

export type QuestType = "habit" | "boss";

export interface Player {
  id: string;
  name: string;
  title: string; // e.g. "Novice Adventurer"
  avatarUrl: string | null;
  level: number;
  // NOTE: presentation contract only, not a source of truth.
  // currentXP / xpToNextLevel represent progress *within the current
  // level* (e.g. "340 of 500 to level 8") for rendering the XP bar —
  // they are NOT assumed to be the player's cumulative/lifetime XP
  // total from the database. When wired to the authoritative
  // character data, adapt whatever the backend stores (lifetime XP,
  // per-level thresholds, etc.) into this shape; do not read these
  // fields elsewhere as if they were the raw database value.
  currentXP: number;
  xpToNextLevel: number;
  gold: number;
  streakDays: number;
  // Raw attribute counts from the database (unbounded, +1 per quest
  // completion in that category — see complete_quest()). The bar in
  // AttributeBar visually clamps at 100 for display only; the real
  // number is always shown alongside it.
  attributes: Record<AttributeKey, number>;
}

export interface QuestDeadlinePenalty {
  daysLate: number;
  penaltyAmount: number;
  processedAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  xpReward: number;
  goldReward: number;
  frequency: QuestFrequency;
  completed: boolean;
  questType?: QuestType;
  deadlineAt?: string | null;
  bonusXpReward?: number;
  bonusGoldReward?: number;
  progress?: number;
  penalty?: QuestDeadlinePenalty | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string; // lucide icon name, resolved by the ShopItemCard
  owned: boolean;
  // Matches shop_items.type in the database exactly (see
  // supabase/migrations/001_irl_xp_schema.sql). Not invented here.
  category: "theme" | "avatar" | "badge" | "title" | "cosmetic";
}

// Presentation contract only. This is the shape the dashboard UI
// renders from — it is intentionally decoupled from however the
// authoritative character/quest/shop data ends up modeled in
// Supabase. A future adapter (in the server action layer, not here)
// should map the real data into this shape rather than the
// components being changed to read the raw database model directly.
export interface DashboardData {
  player: Player;
  quests: Quest[];
  shopItems: ShopItem[];
}
