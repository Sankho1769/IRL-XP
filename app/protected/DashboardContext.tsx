// app/protected/DashboardContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Character } from "@/app/actions/character";
import {
  completeQuest,
  deleteQuest,
  processDeadlinePenalties,
  type Quest as DbQuest,
  type QuestCompletion,
  type CompleteQuestResult,
  type ProcessedPenalty,
} from "@/app/actions/quests";
import { purchaseItem, type ShopItem as DbShopItem, type InventoryItem } from "@/app/actions/shop";
import type { Profile, ThemeKey } from "@/app/actions/profile";
import {
  characterToPlayer,
  dbQuestToPresentation,
  dbShopItemToPresentation,
  isQuestCompleted,
} from "@/lib/dashboard/character-adapter";
import type { AttributeKey, Player, Quest, ShopItem } from "@/types/dashboard";
import { BossVictoryOverlay } from "@/components/dashboard/BossVictoryOverlay";
import type { AchievementWithStatus, UnlockedAchievement } from "@/app/actions/achievements";
import { AchievementUnlockOverlay } from "@/components/dashboard/AchievementUnlockOverlay";
import { QuestPenaltyNotification } from "@/components/dashboard/QuestPenaltyNotification";

function toUserFriendlyError(rawError: string): string {
  switch (rawError) {
    case "INVALID_DEADLINE":
      return "Choose a future date and time.";
    case "ALREADY_COMPLETED":
      return "This quest is already completed.";
    case "EXPIRED":
      return "This quest deadline has passed.";
    case "BOSS_EXPIRED":
      return "This boss has escaped. The deadline has passed.";
    case "INSUFFICIENT_GOLD":
      return "You do not have enough gold to purchase this item.";
    case "ALREADY_OWNED":
      return "You already own this item.";
    case "CHARACTER_NOT_FOUND":
      return "Character not found. Please refresh the page.";
    case "UNAUTHENTICATED":
      return "Your session has expired. Please sign in again.";
    case "FORBIDDEN":
      return "You do not have permission to perform this action.";
    case "NOT_FOUND":
      return "The requested quest or item was not found.";
    case "INVALID_QUEST":
      return "This quest is inactive or invalid.";
    case "INVALID_ITEM":
      return "This item is inactive or invalid.";
    case "INVALID_INPUT":
      return "Please check the quest details and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

interface DashboardContextType {
  userEmail: string;
  displayName: string;
  avatarUrl: string | null;
  theme: ThemeKey;
  updateProfileState: (updates: {
    display_name?: string;
    avatar_url?: string | null;
    theme?: ThemeKey;
  }) => void;
  showProfileModal: boolean;
  setShowProfileModal: (open: boolean) => void;
  character: Character | null;
  player: Player | null;
  quests: DbQuest[];
  presentationQuests: Quest[];
  completedQuestIds: Set<string>;
  importantQuestIds: Set<string>;
  toggleImportantQuest: (questId: string) => void;
  shopItems: DbShopItem[];
  presentationShopItems: ShopItem[];
  ownedItemIds: Set<string>;
  pendingQuestId: string | null;
  pendingItemId: string | null;
  levelUpTo: number | null;
  levelUpOldLevel: number | null;
  dismissLevelUp: () => void;
  recentAttributeIncrease: {
    key: AttributeKey;
    amount: number;
    timestamp: number;
  } | null;
  isNewQuestModalOpen: boolean;
  setIsNewQuestModalOpen: (open: boolean) => void;
  handleQuestComplete: (quest: { id: string }) => Promise<CompleteQuestResult | null>;
  handleQuestDelete: (questId: string) => Promise<boolean>;
  handlePurchase: (item: { id: string }) => Promise<void>;
  handleQuestCreated: (newQuest: DbQuest) => void;
  hasCompletedAnyQuest: boolean;
  achievements: AchievementWithStatus[];
  unlockedAchievementOverlay: UnlockedAchievement | null;
  dismissAchievementOverlay: () => void;
  error: string | null;
  clearError: () => void;
  successMessage: string | null;
  dismissSuccessMessage: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

interface DashboardProviderProps {
  children: React.ReactNode;
  userEmail: string;
  initialCharacter: Character | null;
  characterError: string | null;
  initialQuests: DbQuest[];
  initialCompletions: QuestCompletion[];
  initialShopItems: DbShopItem[];
  initialInventory: InventoryItem[];
  initialAchievements: AchievementWithStatus[];
  initialProfile?: Profile | null;
}

export function DashboardProvider({
  children,
  userEmail,
  initialCharacter,
  characterError,
  initialQuests,
  initialCompletions,
  initialShopItems,
  initialInventory,
  initialAchievements,
  initialProfile,
}: DashboardProviderProps) {
  const [character, setCharacter] = useState<Character | null>(initialCharacter);
  const [quests, setQuests] = useState<DbQuest[]>(initialQuests);
  const [shopItems] = useState<DbShopItem[]>(initialShopItems);
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>(initialAchievements);
  const [unlockedAchievementOverlay, setUnlockedAchievementOverlay] = useState<UnlockedAchievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<UnlockedAchievement[]>([]);

  // Profile & Theme state: Database profiles.theme is authoritative for authenticated users.
  // localStorage is strictly a pre-auth fallback / UI cache.
  const defaultDisplayName = initialProfile?.display_name || (userEmail ? userEmail.split("@")[0] : "Player");
  const [displayName, setDisplayName] = useState<string>(defaultDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatar_url || null);
  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (initialProfile?.theme && ["dark", "crimson", "arcane"].includes(initialProfile.theme)) {
      return initialProfile.theme;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("irl_xp_theme") as ThemeKey;
        if (stored && ["dark", "crimson", "arcane"].includes(stored)) return stored;
      } catch {}
    }
    return "dark";
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Authoritative DB theme sync: On login/load, sync localStorage and document data-theme to DB profile value.
  // Stale localStorage will never overwrite the DB profile theme after profile loads.
  useEffect(() => {
    if (initialProfile?.theme && ["dark", "crimson", "arcane"].includes(initialProfile.theme)) {
      setTheme(initialProfile.theme);
      try {
        localStorage.setItem("irl_xp_theme", initialProfile.theme);
        document.documentElement.setAttribute("data-theme", initialProfile.theme);
      } catch {}
    }
  }, [initialProfile?.theme]);

  // Sync profile display name and avatar if server props change
  useEffect(() => {
    if (initialProfile) {
      if (initialProfile.display_name) setDisplayName(initialProfile.display_name);
      setAvatarUrl(initialProfile.avatar_url || null);
    }
  }, [initialProfile]);

  // Sync theme to document element and localStorage on explicit user change
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("irl_xp_theme", theme);
    } catch {}
  }, [theme]);

  function updateProfileState(updates: {
    display_name?: string;
    avatar_url?: string | null;
    theme?: ThemeKey;
  }) {
    if (updates.display_name !== undefined) setDisplayName(updates.display_name);
    if (updates.avatar_url !== undefined) setAvatarUrl(updates.avatar_url);
    if (updates.theme !== undefined && ["dark", "crimson", "arcane"].includes(updates.theme)) {
      setTheme(updates.theme);
      try {
        localStorage.setItem("irl_xp_theme", updates.theme);
        document.documentElement.setAttribute("data-theme", updates.theme);
      } catch {}
    }
  }

  const dismissAchievementOverlay = () => {
    if (achievementQueue.length > 0) {
      const next = achievementQueue[0];
      setAchievementQueue((prev) => prev.slice(1));
      setUnlockedAchievementOverlay(next);
    } else {
      setUnlockedAchievementOverlay(null);
    }
  };

  const [activePenaltyNotification, setActivePenaltyNotification] = useState<ProcessedPenalty | null>(null);
  const [penaltyQueue, setPenaltyQueue] = useState<ProcessedPenalty[]>([]);

  const dismissPenaltyNotification = () => {
    if (penaltyQueue.length > 0) {
      const next = penaltyQueue[0];
      setPenaltyQueue((prev) => prev.slice(1));
      setActivePenaltyNotification(next);
    } else {
      setActivePenaltyNotification(null);
    }
  };

  // Check and authoritatively process missed-deadline penalties on application load
  useEffect(() => {
    let active = true;
    async function initPenalties() {
      try {
        const res = await processDeadlinePenalties();
        if (!active || res.error || !res.data || res.data.length === 0) return;
        const newPenalties = res.data;

        // Atomically update local quest progress and penalty states
        setQuests((prev) =>
          prev.map((q) => {
            const match = newPenalties.find((p) => p.questId === q.id);
            if (match) {
              return {
                ...q,
                progress: match.newProgress,
                penalty: {
                  daysLate: match.daysLate,
                  penaltyAmount: match.penaltyAmount,
                  processedAt: new Date().toISOString(),
                },
              };
            }
            return q;
          })
        );

        // Show one-time notification
        setActivePenaltyNotification(newPenalties[0]);
        if (newPenalties.length > 1) {
          setPenaltyQueue((prev) => [...prev, ...newPenalties.slice(1)]);
        }
      } catch {
        // Silently ignore network failure on background check
      }
    }
    initPenalties();
    return () => {
      active = false;
    };
  }, []);

  // Compute initially completed quest IDs from existing completion rows
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const q of initialQuests) {
      if (isQuestCompleted(q, initialCompletions)) {
        ids.add(q.id);
      }
    }
    return ids;
  });

  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(
    () => new Set(initialInventory.map((entry) => entry.item_id))
  );

  // Important / pinned quests stored in localStorage
  const [importantQuestIds, setImportantQuestIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set<string>();
    }
    try {
      const stored = localStorage.getItem("irl_xp_important_quests");
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });

  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const [levelUpOldLevel, setLevelUpOldLevel] = useState<number | null>(null);

  const dismissLevelUp = () => {
    setLevelUpTo(null);
    setLevelUpOldLevel(null);
  };

  const [recentAttributeIncrease, setRecentAttributeIncrease] = useState<{
    key: AttributeKey;
    amount: number;
    timestamp: number;
  } | null>(null);
  const [bossVictory, setBossVictory] = useState<(CompleteQuestResult & { questTitle: string }) | null>(null);
  const [isNewQuestModalOpen, setIsNewQuestModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(
    characterError ? toUserFriendlyError(characterError) : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = () => setError(null);
  const dismissSuccessMessage = () => setSuccessMessage(null);

  // Auto-clear attribute increase after 3.5s
  useEffect(() => {
    if (!recentAttributeIncrease) return;
    const timer = setTimeout(() => setRecentAttributeIncrease(null), 3500);
    return () => clearTimeout(timer);
  }, [recentAttributeIncrease]);

  // Sync important quests from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("irl_xp_important_quests");
      if (stored) {
        setImportantQuestIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-dismiss success message after 4s
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const toggleImportantQuest = (questId: string) => {
    setImportantQuestIds((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      try {
        localStorage.setItem("irl_xp_important_quests", JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const player = useMemo(
    () => (character ? characterToPlayer(character, displayName, avatarUrl) : null),
    [character, displayName, avatarUrl]
  );

  const presentationQuests = useMemo(
    () => quests.map((q) => dbQuestToPresentation(q, completedQuestIds.has(q.id))),
    [quests, completedQuestIds]
  );

  const presentationShopItems = useMemo(
    () => shopItems.map((item) => dbShopItemToPresentation(item, ownedItemIds.has(item.id))),
    [shopItems, ownedItemIds]
  );

  const hasCompletedAnyQuest = useMemo(() => {
    return initialCompletions.length > 0 || completedQuestIds.size > 0 || (character?.xp ?? 0) > 0;
  }, [initialCompletions, completedQuestIds, character]);

  async function handleQuestComplete(quest: { id: string }): Promise<CompleteQuestResult | null> {
    if (pendingQuestId || completedQuestIds.has(quest.id)) return null;

    const questObj = quests.find((q) => q.id === quest.id);

    setError(null);
    setPendingQuestId(quest.id);

    try {
      const result = await completeQuest(quest.id);

      if (result.error || !result.data) {
        setError(toUserFriendlyError(result.error ?? "DATABASE_ERROR"));
        return null;
      }
      const rpc = result.data;
      const oldCharacter = character;
      const oldLevel = oldCharacter?.level ?? 1;

      // Authoritatively detect if any attributes increased
      if (oldCharacter?.attributes && rpc.attributes) {
        const attrKeys: AttributeKey[] = ["strength", "intelligence", "discipline", "health", "creativity"];
        for (const k of attrKeys) {
          const oldVal = oldCharacter.attributes[k] ?? 0;
          const newVal = (rpc.attributes as Character["attributes"])[k] ?? 0;
          if (newVal > oldVal) {
            setRecentAttributeIncrease({
              key: k,
              amount: newVal - oldVal,
              timestamp: Date.now(),
            });
            break;
          }
        }
      }

      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              xp: rpc.newTotalXp,
              level: rpc.newLevel,
              gold: prev.gold + rpc.goldAwarded,
              streak_count: rpc.streak,
              attributes: rpc.attributes as Character["attributes"],
            }
          : prev
      );
      setCompletedQuestIds((prev) => new Set(prev).add(quest.id));

      if (rpc.isBoss) {
        setBossVictory({
          ...rpc,
          questTitle: questObj?.title ?? "Boss Challenge",
        });
      } else if (rpc.didLevelUp) {
        setLevelUpOldLevel(oldLevel);
        setLevelUpTo(rpc.newLevel);
      }

      // Handle authoritatively unlocked achievements
      if (rpc.newAchievements && rpc.newAchievements.length > 0) {
        const newlyUnlocked = rpc.newAchievements;
        const newlyUnlockedCodes = new Set(newlyUnlocked.map((a) => a.code));

        setAchievements((prev) =>
          prev.map((item) => {
            if (newlyUnlockedCodes.has(item.code)) {
              const matched = newlyUnlocked.find((a) => a.code === item.code);
              return {
                ...item,
                isUnlocked: true,
                unlockedAt: matched?.unlockedAt ?? new Date().toISOString(),
              };
            }
            return item;
          })
        );

        if (!unlockedAchievementOverlay) {
          setUnlockedAchievementOverlay(newlyUnlocked[0]);
          if (newlyUnlocked.length > 1) {
            setAchievementQueue((prev) => [...prev, ...newlyUnlocked.slice(1)]);
          }
        } else {
          setAchievementQueue((prev) => [...prev, ...newlyUnlocked]);
        }
      }

      return rpc;
    } catch {
      setError("An unexpected error occurred. Please try again.");
      return null;
    } finally {
      setPendingQuestId(null);
    }
  }

  async function handleQuestDelete(questId: string): Promise<boolean> {
    try {
      const res = await deleteQuest(questId);
      if (res.error) {
        setError("Unable to abandon quest.");
        return false;
      }
      setQuests((prev) => prev.filter((q) => q.id !== questId));
      setCompletedQuestIds((prev) => {
        const next = new Set(prev);
        next.delete(questId);
        return next;
      });
      setSuccessMessage("Quest abandoned.");
      return true;
    } catch {
      setError("An unexpected error occurred while deleting the quest.");
      return false;
    }
  }

  async function handlePurchase(item: { id: string }) {
    if (pendingItemId || ownedItemIds.has(item.id)) return;

    setError(null);
    setPendingItemId(item.id);

    try {
      const result = await purchaseItem(item.id);

      if (result.error || !result.data) {
        setError(toUserFriendlyError(result.error ?? "DATABASE_ERROR"));
        return;
      }
      const rpc = result.data;
      setCharacter((prev) => (prev ? { ...prev, gold: rpc.remainingGold } : prev));
      setOwnedItemIds((prev) => new Set(prev).add(item.id));
      setSuccessMessage(`Successfully purchased "${rpc.itemName}"!`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setPendingItemId(null);
    }
  }

  function handleQuestCreated(newQuest: DbQuest) {
    setQuests((prev) => [newQuest, ...prev]);
  }

  return (
    <DashboardContext.Provider
      value={{
        userEmail,
        displayName,
        avatarUrl,
        theme,
        updateProfileState,
        showProfileModal,
        setShowProfileModal,
        character,
        player,
        quests,
        presentationQuests,
        completedQuestIds,
        importantQuestIds,
        toggleImportantQuest,
        shopItems,
        presentationShopItems,
        ownedItemIds,
        pendingQuestId,
        pendingItemId,
        levelUpTo,
        levelUpOldLevel,
        dismissLevelUp,
        recentAttributeIncrease,
        isNewQuestModalOpen,
        setIsNewQuestModalOpen,
        handleQuestComplete,
        handleQuestDelete,
        handlePurchase,
        handleQuestCreated,
        hasCompletedAnyQuest,
        achievements,
        unlockedAchievementOverlay,
        dismissAchievementOverlay,
        error,
        clearError,
        successMessage,
        dismissSuccessMessage,
      }}
    >
      {children}

      {/* Boss Victory Overlay */}
      {bossVictory && (
        <BossVictoryOverlay
          victory={bossVictory}
          onClose={() => setBossVictory(null)}
        />
      )}

      {/* Achievement Unlock Overlay */}
      {unlockedAchievementOverlay && (
        <AchievementUnlockOverlay
          achievement={unlockedAchievementOverlay}
          onClose={dismissAchievementOverlay}
        />
      )}

      {/* Deadline Penalty Notification Banner */}
      {activePenaltyNotification && (
        <QuestPenaltyNotification
          penalty={activePenaltyNotification}
          onDismiss={dismissPenaltyNotification}
        />
      )}
    </DashboardContext.Provider>
  );
}
