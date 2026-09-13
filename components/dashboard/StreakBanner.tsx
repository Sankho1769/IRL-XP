// components/dashboard/StreakBanner.tsx
"use client";

import React from "react";
import { Flame } from "lucide-react";

interface StreakBannerProps {
  streakDays: number;
  last7Days?: boolean[];
}

export function StreakBanner({ streakDays, last7Days }: StreakBannerProps) {
  const days = last7Days ?? Array.from({ length: 7 }, (_, i) => i < 5);

  return (
    <section
      className="xp-panel relative overflow-hidden p-4 sm:p-5 border border-[var(--xp-ember)]/30"
      aria-label={`Current streak: ${streakDays} days`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl bg-[var(--xp-ember)]"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="xp-streak-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--xp-ember)]/40 bg-[var(--xp-ember)]/15 shadow-md shadow-[var(--xp-ember)]/20">
            <Flame className="xp-streak-flame h-6 w-6 text-[var(--xp-ember)]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-rpg text-2xl font-bold leading-none tabular-nums text-[var(--xp-text)]">
              {streakDays}
              <span className="ml-1.5 text-xs font-normal text-[var(--xp-text-muted)] font-sans">
                day streak
              </span>
            </p>
            <p className="mt-1 text-xs text-[var(--xp-text-muted)] font-serif italic">
              Complete a quest today to maintain your momentum.
            </p>
          </div>
        </div>

        <div className="hidden items-end gap-1.5 sm:flex" aria-hidden="true">
          {days.map((done, i) => (
            <span
              key={i}
              className={`w-2.5 rounded-full transition-all ${
                done ? "bg-[var(--xp-ember)] shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-white/10"
              }`}
              style={{ height: done ? "26px" : "14px" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
