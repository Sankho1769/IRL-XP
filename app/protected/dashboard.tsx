"use client";

import { useMemo, useState } from "react";
import "@/styles/dashboard.css";

import type { Character } from "@/app/actions/character";
import { completeQuest, type Quest as DbQuest } from "@/app/actions/quests";
import { purchaseItem, type ShopItem as DbShopItem, type InventoryItem } from "@/app/actions/shop";
import {
  characterToPlayer,
  dbQuestToPresentation,
  dbShopItemToPresentation,
} from "@/lib/dashboard/character-adapter";

import { PlayerHeader } from "@/components/dashboard/PlayerHeader";
import { CharacterStatus } from "@/components/dashboard/CharacterStatus";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { QuestList } from "@/components/dashboard/QuestList";
import { ShopSection } from "@/components/dashboard/ShopSection";
import { SidebarNav, type DashboardTab } from "@/components/dashboard/SidebarNav";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { LevelUpOverlay } from "@/components/dashboard/LevelUpOverlay";
import SignOutButton from "./sign-out-button";

type DashboardProps = {
  userEmail: string;
  initialCharacter: Character | null;
  characterError: string | null;
  initialQuests: DbQuest[];
  initialShopItems: DbShopItem[];
  initialInventory: InventoryItem[];
};

export default function Dashboard({
  userEmail,
  initialCharacter,
  characterError,
  initialQuests,
  initialShopItems,
  initialInventory,
}: DashboardProps) {
  const [tab, setTab] = useState<DashboardTab>("home");
  const [character, setCharacter] = useState<Character | null>(initialCharacter);
  const [quests] = useState<DbQuest[]>(initialQuests);
  const [shopItems] = useState<DbShopItem[]>(initialShopItems);

  // Completion/ownership are tracked locally for the current session,
  // same as the previous implementation — real completion/purchase
  // history lives in quest_completions / user_inventory in Postgres;
  // this Set only reflects what's already been confirmed by the RPCs
  // called from *this* page load onward, plus whatever inventory was
  // already owned when the page loaded.
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(
    () => new Set(initialInventory.map((entry) => entry.item_id))
  );

  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(characterError);

  const displayName = useMemo(() => {
    const prefix = userEmail.split("@")[0];
    return prefix && prefix.length > 0 ? prefix : "Player";
  }, [userEmail]);

  const player = useMemo(
    () => (character ? characterToPlayer(character, displayName) : null),
    [character, displayName]
  );

  const presentationQuests = useMemo(
    () => quests.map((q) => dbQuestToPresentation(q, completedIds.has(q.id))),
    [quests, completedIds]
  );

  const presentationShopItems = useMemo(
    () => shopItems.map((item) => dbShopItemToPresentation(item, ownedItemIds.has(item.id))),
    [shopItems, ownedItemIds]
  );

  async function handleQuestComplete(quest: { id: string }) {
    setError(null);
    setPendingQuestId(quest.id);
    const result = await completeQuest(quest.id);
    setPendingQuestId(null);

    if (result.error || !result.data) {
      setError(result.error ?? "DATABASE_ERROR");
      return;
    }
    const rpc = result.data;
    // Everything below comes straight from complete_quest()'s response.
    // No XP, gold, level, streak, or attribute value is computed here.
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
    setCompletedIds((prev) => new Set(prev).add(quest.id));

    if (rpc.didLevelUp) {
      setLevelUpTo(rpc.newLevel);
    }
  }

  async function handlePurchase(item: { id: string }) {
    setError(null);
    setPendingItemId(item.id);
    const result = await purchaseItem(item.id);
    setPendingItemId(null);

    if (result.error || !result.data) {
      setError(result.error ?? "DATABASE_ERROR");
      return;
    }
    const rpc = result.data;
    // Gold deduction comes straight from purchase_item()'s response.
    setCharacter((prev) => (prev ? { ...prev, gold: rpc.remainingGold } : prev));
    setOwnedItemIds((prev) => new Set(prev).add(item.id));
  }

  if (!character || !player) {
    return (
      <div className="xp-scope flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-[var(--xp-text-muted)]">
          {error === "CHARACTER_NOT_FOUND"
            ? "No character found for this account yet."
            : error ?? "Could not load character."}
        </p>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="xp-scope min-h-screen">
      <div className="mx-auto flex max-w-6xl gap-5 p-4 pb-24 sm:p-6 md:pb-6">
        <SidebarNav active={tab} onChange={setTab} />

        <main className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--xp-text-muted)]">{userEmail}</p>
            <SignOutButton />
          </div>

          {error && (
            <p
              role="alert"
              className="xp-panel-flat border border-[var(--xp-ember)]/40 px-3 py-2 text-sm text-[var(--xp-ember)]"
            >
              {error}
            </p>
          )}

          <PlayerHeader player={player} />

          {tab === "home" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="flex flex-col gap-5 lg:col-span-2">
                <StreakBanner streakDays={player.streakDays} />
                <QuestList
                  quests={presentationQuests}
                  onQuestComplete={handleQuestComplete}
                  pendingQuestId={pendingQuestId}
                />
              </div>
              <div className="flex flex-col gap-5">
                <CharacterStatus player={player} />
              </div>
            </div>
          )}

          {tab === "quests" && (
            <QuestList
              quests={presentationQuests}
              onQuestComplete={handleQuestComplete}
              pendingQuestId={pendingQuestId}
            />
          )}

          {tab === "character" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <CharacterStatus player={player} />
              <StreakBanner streakDays={player.streakDays} />
            </div>
          )}

          {tab === "shop" && (
            <ShopSection
              items={presentationShopItems}
              playerGold={player.gold}
              onPurchase={handlePurchase}
              pendingItemId={pendingItemId}
            />
          )}
        </main>
      </div>

      <BottomNav active={tab} onChange={setTab} />

      {levelUpTo !== null && (
        <LevelUpOverlay level={levelUpTo} onDismiss={() => setLevelUpTo(null)} />
      )}
    </div>
  );
}
