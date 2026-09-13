// components/dashboard/CharacterStatus.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Dumbbell,
  Brain,
  Target,
  HeartPulse,
  Palette,
  Flame,
  Sparkles,
  ChevronRight,
  Shield,
} from "lucide-react";
import type { Player, AttributeKey } from "@/types/dashboard";
import { useDashboard } from "@/app/protected/DashboardContext";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";

interface CharacterStatusProps {
  player: Player;
}

const ATTRIBUTES = [
  {
    key: "strength" as AttributeKey,
    label: "Strength",
    abbr: "STR",
    icon: Dumbbell,
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.15)",
  },
  {
    key: "intelligence" as AttributeKey,
    label: "Intelligence",
    abbr: "INT",
    icon: Brain,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.15)",
  },
  {
    key: "discipline" as AttributeKey,
    label: "Discipline",
    abbr: "DIS",
    icon: Target,
    color: "#E5B869",
    bg: "rgba(229, 184, 105, 0.15)",
  },
  {
    key: "health" as AttributeKey,
    label: "Health",
    abbr: "HEA",
    icon: HeartPulse,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.15)",
  },
  {
    key: "creativity" as AttributeKey,
    label: "Creativity",
    abbr: "CRE",
    icon: Palette,
    color: "#A78BFA",
    bg: "rgba(167, 139, 250, 0.15)",
  },
];

export function CharacterStatus({ player }: CharacterStatusProps) {
  const { recentAttributeIncrease } = useDashboard();
  const animatedXP = useAnimatedNumber(player.currentXP);
  const xpPct = Math.max(
    5,
    Math.min(100, (animatedXP / player.xpToNextLevel) * 100)
  );

  return (
    <section
      className="xp-panel flex flex-col gap-5 p-5 sm:p-6 border border-white/[0.08]"
      aria-label="Character Summary"
    >
      {/* Header with Title and Link */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--xp-gold)]" />
          <h3 className="font-rpg text-base sm:text-lg font-bold text-[var(--xp-text)] tracking-wide">
            Character
          </h3>
        </div>

        <Link
          href="/protected/character"
          className="flex items-center gap-1 text-xs font-semibold text-[var(--xp-text-muted)] hover:text-[var(--xp-gold)] transition-colors"
        >
          <span>Sheet</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Atmospheric Portrait & Identity */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--xp-border-gold)]/50 bg-[#080C14] shadow-lg">
        <div className="relative h-44 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/character_portrait.jpg"
            alt={player.name}
            className="h-full w-full object-cover object-top hover:scale-105 transition-transform duration-700"
          />
          {/* Vignette gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/40 to-transparent" />

          {/* Level Badge in top corner */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-[var(--xp-border-gold)] bg-[#080C14]/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[var(--xp-gold)]">
            <Sparkles className="h-3 w-3" />
            <span>Level {player.level}</span>
          </div>
        </div>

        {/* Name and XP in bottom card */}
        <div className="p-4 pt-1">
          <h4 className="font-rpg text-lg font-bold text-[var(--xp-text)] leading-tight">
            {player.name}
          </h4>
          <p className="text-xs text-[var(--xp-gold)] font-medium mt-0.5">
            {player.title}
          </p>

          {/* XP Progress */}
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--xp-text-muted)] font-medium">Experience</span>
              <span className="font-bold tabular-nums text-[var(--xp-gold)]">
                {animatedXP.toLocaleString()} / {player.xpToNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/60 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--xp-arcane)] to-[var(--xp-gold)] shadow-[0_0_8px_rgba(229,184,105,0.4)] transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Horizontal Bars */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--xp-text-muted)]">
          Core Attributes
        </span>

        <div className="flex flex-col gap-2.5">
          {ATTRIBUTES.map((attr) => {
            const val = player.attributes[attr.key] ?? 0;
            // Visual scale based on 50 for satisfying early-to-mid visual feedback
            const fillPct = Math.min(100, Math.max(8, (val / 50) * 100));
            const Icon = attr.icon;
            const isHighlighted = recentAttributeIncrease?.key === attr.key;

            return (
              <div
                key={attr.key}
                className={`flex items-center gap-3 rounded-xl border bg-[var(--xp-void-raised)]/60 p-2.5 transition-all ${
                  isHighlighted
                    ? "xp-attr-highlight border-[var(--xp-gold)]"
                    : "border-white/[0.05] hover:border-white/10"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: attr.bg,
                    borderColor: `${attr.color}40`,
                    color: attr.color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--xp-text)] text-[11px]">
                        {attr.label}
                      </span>
                      {isHighlighted && (
                        <span className="text-[10px] font-bold text-[var(--xp-gold)] animate-pulse">
                          +{recentAttributeIncrease.amount}
                        </span>
                      )}
                    </div>
                    <span
                      className="font-extrabold tabular-nums text-xs"
                      style={{ color: attr.color }}
                    >
                      {val}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: attr.color,
                        boxShadow: `0 0 6px ${attr.color}60`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
