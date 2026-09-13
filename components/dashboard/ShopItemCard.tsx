// components/dashboard/ShopItemCard.tsx
"use client";

import React from "react";
import {
  Flame,
  Zap,
  Crown,
  Shield,
  Sparkles,
  FlaskConical,
  Coins,
  Check,
  Palette,
  User,
  Award,
  Loader2,
} from "lucide-react";
import type { ShopItem } from "@/types/dashboard";

const ICONS = {
  Flame,
  Zap,
  Crown,
  Shield,
  Sparkles,
  FlaskConical,
  Palette,
  User,
  Award,
} as const;

interface ShopItemCardProps {
  item: ShopItem;
  playerGold: number;
  pending?: boolean;
  onPurchase?: (item: ShopItem) => void;
}

// Visual theme gradients/accents for different types
function getVisualForCategory(category: ShopItem["category"], name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("forest")) {
    return {
      gradient: "from-emerald-950 via-teal-900 to-[#080C14]",
      accent: "#10B981",
      border: "rgba(16, 185, 129, 0.3)",
    };
  }
  if (lowerName.includes("midnight")) {
    return {
      gradient: "from-purple-950 via-indigo-950 to-[#080C14]",
      accent: "#A855F7",
      border: "rgba(168, 85, 247, 0.3)",
    };
  }
  if (lowerName.includes("sunset")) {
    return {
      gradient: "from-amber-950 via-orange-950 to-[#080C14]",
      accent: "#F59E0B",
      border: "rgba(245, 158, 11, 0.3)",
    };
  }
  if (lowerName.includes("celestial")) {
    return {
      gradient: "from-blue-950 via-cyan-950 to-[#080C14]",
      accent: "#38BDF8",
      border: "rgba(56, 189, 248, 0.3)",
    };
  }

  // Defaults by category
  switch (category) {
    case "theme":
      return {
        gradient: "from-indigo-950 via-[#162035] to-[#080C14]",
        accent: "#818CF8",
        border: "rgba(129, 140, 248, 0.3)",
      };
    case "badge":
      return {
        gradient: "from-amber-950/60 via-[#162035] to-[#080C14]",
        accent: "var(--xp-gold)",
        border: "var(--xp-border-gold)",
      };
    case "title":
      return {
        gradient: "from-purple-950/60 via-[#162035] to-[#080C14]",
        accent: "#C084FC",
        border: "rgba(192, 132, 252, 0.3)",
      };
    case "avatar":
      return {
        gradient: "from-cyan-950/60 via-[#162035] to-[#080C14]",
        accent: "#38BDF8",
        border: "rgba(56, 189, 248, 0.3)",
      };
    default:
      return {
        gradient: "from-[#162035] to-[#080C14]",
        accent: "var(--xp-gold)",
        border: "rgba(255, 255, 255, 0.1)",
      };
  }
}

export function ShopItemCard({
  item,
  playerGold,
  pending,
  onPurchase,
}: ShopItemCardProps) {
  const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Sparkles;
  const canAfford = playerGold >= item.price;
  const style = getVisualForCategory(item.category, item.name);

  return (
    <article
      className={`xp-panel overflow-hidden flex flex-col justify-between border transition-all duration-300 p-0 ${
        item.owned
          ? "border-emerald-500/30 shadow-sm"
          : "border-white/[0.08] hover:border-[var(--xp-border-gold)] hover:shadow-lg hover:shadow-[var(--xp-gold)]/5"
      }`}
    >
      {/* Top Banner / Visual Thumbnail */}
      <div
        className={`relative h-28 w-full bg-gradient-to-br ${style.gradient} flex items-center justify-center border-b border-white/[0.06] overflow-hidden group`}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 opacity-20 blur-xl transition-opacity group-hover:opacity-40"
          style={{ backgroundColor: style.accent }}
        />

        {/* Center Icon */}
        <div
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: "rgba(8, 12, 20, 0.7)",
            borderColor: style.border,
            color: style.accent,
          }}
        >
          <Icon className="h-7 w-7" />
        </div>

        {/* Category Pill in top-right */}
        <span className="absolute top-2.5 right-2.5 rounded-full border border-white/10 bg-[#080C14]/80 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold text-[var(--xp-text-muted)] uppercase tracking-wider">
          {item.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1 justify-between bg-[#111827]/90">
        <div>
          <h4 className="font-rpg text-sm font-bold text-[var(--xp-text)] leading-snug">
            {item.name}
          </h4>
          <p className="text-xs text-[var(--xp-text-muted)] leading-relaxed mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums text-[var(--xp-gold)]">
            <Coins className="h-4 w-4 text-[var(--xp-gold)]" />
            <span>{item.price.toLocaleString()} Gold</span>
          </div>

          <button
            type="button"
            disabled={item.owned || !canAfford || pending}
            onClick={() => onPurchase?.(item)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              item.owned
                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 cursor-default"
                : canAfford
                ? "xp-btn-gold"
                : "border border-white/10 bg-white/5 text-[var(--xp-text-faint)] cursor-not-allowed"
            }`}
          >
            {item.owned ? (
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                Owned
              </span>
            ) : pending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#080C14]" />
                <span>Purchasing...</span>
              </span>
            ) : canAfford ? (
              "Purchase"
            ) : (
              "Need Gold"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
