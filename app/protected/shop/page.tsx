// app/protected/shop/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "../DashboardContext";
import { ShopItemCard } from "@/components/dashboard/ShopItemCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Store, Coins } from "lucide-react";
import type { ShopItem } from "@/types/dashboard";

type CategoryFilter = "all" | ShopItem["category"] | "utility";

export default function ShopPage() {
  const { presentationShopItems, player, handlePurchase, pendingItemId } =
    useDashboard();

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { key: "all", label: "All Items" },
    { key: "theme", label: "Themes" },
    { key: "avatar", label: "Avatars" },
    { key: "badge", label: "Badges" },
    { key: "title", label: "Titles" },
    { key: "cosmetic", label: "Utilities" },
  ];

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return presentationShopItems;
    if (activeCategory === "cosmetic") {
      return presentationShopItems.filter(
        (i) => i.category === "cosmetic" || (i.category as string) === "utility"
      );
    }
    return presentationShopItems.filter((i) => i.category === activeCategory);
  }, [presentationShopItems, activeCategory]);

  const ownedCount = presentationShopItems.filter((i) => i.owned).length;

  if (!player) return null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header Banner with Grand Bazaar / Treasury Atmosphere */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--xp-border-gold)]/40 p-5 sm:p-6 shadow-xl group">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/vintage_desk_parchment.jpg"
            alt="The Grand Bazaar"
            className="h-full w-full object-cover object-[center_40%] opacity-45 filter brightness-100 contrast-115 scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/90 via-[#0A0F1D]/75 to-[#080C14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080C14_85%)]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)] block mb-1">
              ✧ Merchants & Artisans Guild ✧
            </span>
            <h1 className="font-rpg text-2xl sm:text-3xl font-bold tracking-wide text-[var(--xp-text)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              The Grand Bazaar & Shop
            </h1>
            <p className="text-xs text-[var(--xp-text-muted)] mt-1 font-serif italic">
              Spend your hard-earned gold on legendary items, themes, and badges.
            </p>
          </div>

          {/* Prominent Gold Pill */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--xp-border-gold)] bg-[#080C14]/80 backdrop-blur-md px-4 py-2 shadow-sm">
            <Coins className="h-5 w-5 text-[var(--xp-gold)]" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[var(--xp-text-muted)] block leading-none font-medium">
                Treasury
              </span>
              <span className="font-rpg text-base font-extrabold tabular-nums text-[var(--xp-gold)]">
                {player.gold.toLocaleString()} Gold
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Inventory Count */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F1D]/75 backdrop-blur-md p-3.5 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(({ key, label }) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)] shadow-sm shadow-[var(--xp-gold)]/10"
                    : "border border-white/5 bg-[var(--xp-void-raised)] text-[var(--xp-text-muted)] hover:text-white hover:border-white/15"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-[var(--xp-text-muted)] font-serif italic">
          Collected: <strong className="text-[var(--xp-gold)]">{ownedCount}</strong> / {presentationShopItems.length} items
        </span>
      </div>

      {/* Item Cards Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No wares available"
          description="Check back later as new thematic items are stocked in the bazaar."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              playerGold={player.gold}
              pending={pendingItemId === item.id}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
