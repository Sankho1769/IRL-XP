// components/dashboard/AchievementUnlockOverlay.tsx
"use client";

import React, { useEffect, useId } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import type { UnlockedAchievement } from "@/app/actions/achievements";

interface AchievementUnlockOverlayProps {
  achievement: UnlockedAchievement | null;
  onClose: () => void;
}

const TIER_THEMES: Record<
  string,
  {
    border: string;
    bgGlow: string;
    badgeBg: string;
    badgeText: string;
    glowShadow: string;
  }
> = {
  Bronze: {
    border: "#CD7F32",
    bgGlow: "rgba(205, 127, 50, 0.25)",
    badgeBg: "rgba(205, 127, 50, 0.15)",
    badgeText: "#E09A55",
    glowShadow: "0 0 25px rgba(205, 127, 50, 0.5)",
  },
  Silver: {
    border: "#CBD5E1",
    bgGlow: "rgba(203, 213, 225, 0.22)",
    badgeBg: "rgba(203, 213, 225, 0.15)",
    badgeText: "#E2E8F0",
    glowShadow: "0 0 25px rgba(203, 213, 225, 0.5)",
  },
  Gold: {
    border: "var(--xp-gold)",
    bgGlow: "rgba(229, 184, 105, 0.28)",
    badgeBg: "rgba(229, 184, 105, 0.15)",
    badgeText: "var(--xp-gold)",
    glowShadow: "0 0 30px rgba(229, 184, 105, 0.6)",
  },
  Streak: {
    border: "#F97316",
    bgGlow: "rgba(249, 115, 22, 0.28)",
    badgeBg: "rgba(249, 115, 22, 0.15)",
    badgeText: "#FB923C",
    glowShadow: "0 0 30px rgba(249, 115, 22, 0.6)",
  },
  Boss: {
    border: "#EF4444",
    bgGlow: "rgba(239, 68, 68, 0.3)",
    badgeBg: "rgba(239, 68, 68, 0.18)",
    badgeText: "#F87171",
    glowShadow: "0 0 32px rgba(239, 68, 68, 0.65)",
  },
  Diamond: {
    border: "#38BDF8",
    bgGlow: "rgba(56, 189, 248, 0.28)",
    badgeBg: "rgba(56, 189, 248, 0.15)",
    badgeText: "#7DD3FC",
    glowShadow: "0 0 30px rgba(56, 189, 248, 0.6)",
  },
  Legendary: {
    border: "#A855F7",
    bgGlow: "rgba(168, 85, 247, 0.3)",
    badgeBg: "rgba(168, 85, 247, 0.18)",
    badgeText: "#C084FC",
    glowShadow: "0 0 35px rgba(168, 85, 247, 0.65)",
  },
};

export function AchievementUnlockOverlay({
  achievement,
  onClose,
}: AchievementUnlockOverlayProps) {
  const titleId = useId();
  const descId = useId();

  // Auto-dismiss after 3.8 seconds
  useEffect(() => {
    if (!achievement) return;
    const timer = window.setTimeout(onClose, 3800);
    return () => window.clearTimeout(timer);
  }, [achievement, onClose]);

  // Keyboard accessibility: Dismiss on Escape
  useEffect(() => {
    if (!achievement) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [achievement, onClose]);

  if (!achievement) return null;

  const theme = TIER_THEMES[achievement.tier] ?? TIER_THEMES.Gold;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Radial glow background tuned to tier */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full blur-3xl animate-in zoom-in-50 duration-700"
        style={{ backgroundColor: theme.bgGlow }}
        aria-hidden="true"
      />

      <div
        className="xp-panel relative flex flex-col items-center gap-5 px-8 py-9 sm:px-10 sm:py-10 text-center max-w-sm w-full border shadow-2xl animate-in zoom-in-95 duration-300"
        style={{
          borderColor: theme.border,
          boxShadow: theme.glowShadow,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close achievement notification"
          className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Small Ribbon / Banner */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest border"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
          }}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Achievement Unlocked</span>
        </div>

        {/* Trophy Icon Centerpiece */}
        <div className="relative flex items-center justify-center my-1">
          {/* Subtle Rotating Accent Ring */}
          <svg
            className="xp-particle-ring absolute h-24 w-24 pointer-events-none opacity-40"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke={theme.border}
              strokeWidth="1"
              strokeDasharray="3 8"
            />
          </svg>

          {/* Icon Crest */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl shadow-lg bg-[#080C14]/90"
            style={{
              borderColor: theme.border,
              boxShadow: theme.glowShadow,
            }}
          >
            <span role="img" aria-label={achievement.name}>
              {achievement.icon}
            </span>
          </div>
        </div>

        {/* Trophy Name & Tier */}
        <div className="flex flex-col gap-1.5">
          <h2
            id={titleId}
            className="font-rpg text-2xl font-bold tracking-wide text-[var(--xp-text)] leading-tight"
          >
            {achievement.name}
          </h2>

          <div className="flex items-center justify-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                borderColor: `${theme.border}50`,
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
              }}
            >
              {achievement.tier} Tier
            </span>
          </div>

          <p
            id={descId}
            className="text-xs text-[var(--xp-text-muted)] mt-1 max-w-xs font-serif italic"
          >
            {achievement.description}
          </p>
        </div>

        {/* Claim / Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="xp-btn-gold w-full mt-2 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Claim Honors</span>
        </button>
      </div>
    </div>
  );
}
