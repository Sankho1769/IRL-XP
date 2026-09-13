// components/dashboard/QuickStatsStrip.tsx
"use client";

import React from "react";
import { Crown, Flame, Coins, CheckCircle2 } from "lucide-react";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";

interface QuickStatsStripProps {
  level: number;
  streakDays: number;
  gold: number;
  completedQuestsCount: number;
}

export function QuickStatsStrip({
  level,
  streakDays,
  gold,
  completedQuestsCount,
}: QuickStatsStripProps) {
  const displayGold = useAnimatedNumber(gold);

  const stats = [
    {
      label: "Hero Level",
      value: level,
      icon: Crown,
      color: "var(--xp-gold)",
      bg: "rgba(229, 184, 105, 0.12)",
      border: "rgba(229, 184, 105, 0.3)",
    },
    {
      label: "Streak",
      value: `${streakDays}d`,
      icon: Flame,
      color: "var(--xp-ember)",
      bg: "rgba(249, 115, 22, 0.12)",
      border: "rgba(249, 115, 22, 0.3)",
    },
    {
      label: "Realm Gold",
      value: displayGold.toLocaleString(),
      icon: Coins,
      color: "var(--xp-gold)",
      bg: "rgba(229, 184, 105, 0.12)",
      border: "rgba(229, 184, 105, 0.3)",
    },
    {
      label: "Quests Done",
      value: completedQuestsCount,
      icon: CheckCircle2,
      color: "var(--xp-vital)",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.3)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="xp-panel-flat flex items-center gap-3 p-3 sm:p-4 transition-all hover:border-white/20"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                backgroundColor: stat.bg,
                borderColor: stat.border,
                color: stat.color,
              }}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--xp-text-muted)] truncate block">
                {stat.label}
              </span>
              <span
                className="text-lg font-bold tabular-nums text-[var(--xp-text)] block leading-tight font-rpg"
              >
                {stat.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
