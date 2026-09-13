// components/dashboard/ShopSection.tsx
"use client";

import { Store } from "lucide-react";
import type { ShopItem } from "@/types/dashboard";
import { ShopItemCard } from "./ShopItemCard";
import { EmptyState } from "./EmptyState";

interface ShopSectionProps {
  items: ShopItem[];
  playerGold: number;
  onPurchase?: (item: ShopItem) => void;
  /** Item id whose real purchase request is currently in flight. */
  pendingItemId?: string | null;
}

export function ShopSection({ items, playerGold, onPurchase, pendingItemId }: ShopSectionProps) {
  return (
    <section aria-label="Shop" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--xp-text)]">Shop</h2>
        <span className="text-xs text-[var(--xp-text-muted)]">
          {items.filter((i) => i.owned).length} owned
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Your inventory is empty"
          description="Complete quests to earn gold, then spend it here on cosmetics and boosts."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              playerGold={playerGold}
              pending={pendingItemId === item.id}
              onPurchase={onPurchase}
            />
          ))}
        </div>
      )}
    </section>
  );
}
