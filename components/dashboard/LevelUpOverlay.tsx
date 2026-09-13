// components/dashboard/LevelUpOverlay.tsx
"use client";

import React, { useEffect } from "react";
import { Sparkles, Crown, ArrowRight } from "lucide-react";

interface LevelUpOverlayProps {
  level: number;
  oldLevel?: number;
  onDismiss: () => void;
}

export function LevelUpOverlay({ level, oldLevel, onDismiss }: LevelUpOverlayProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3800);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const prevLevel = oldLevel ?? Math.max(1, level - 1);

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      {/* Radial Gold Burst Backdrop */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full bg-[var(--xp-gold)]/20 blur-3xl animate-in zoom-in-50 duration-700"
        aria-hidden="true"
      />

      <div
        className="xp-panel xp-levelup-glow relative flex flex-col items-center gap-4 px-8 py-9 sm:px-10 sm:py-10 text-center max-w-sm w-full border border-[var(--xp-border-gold)] shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Crest Assembly with Rotating Particle Ring */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Rotating Particle Ring */}
          <svg
            className="xp-particle-ring absolute h-24 w-24 text-[var(--xp-gold)]/40 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="46" stroke="rgba(229, 184, 105, 0.25)" strokeWidth="1" strokeDasharray="3 8" />
            <circle cx="50" cy="4" r="2" fill="var(--xp-gold)" />
            <circle cx="96" cy="50" r="2" fill="var(--xp-gold)" />
            <circle cx="50" cy="96" r="2" fill="var(--xp-gold)" />
            <circle cx="4" cy="50" r="2" fill="var(--xp-gold)" />
          </svg>

          {/* Center Crown Emblem */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--xp-gold)] bg-gradient-to-br from-[var(--xp-gold)]/30 to-[#080C14] shadow-[0_0_25px_rgba(229,184,105,0.6)]">
            <Crown className="h-8 w-8 text-[var(--xp-gold)]" />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--xp-gold)] flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Rank Ascended
            <Sparkles className="h-3.5 w-3.5" />
          </span>

          <h2 className="font-rpg text-2xl sm:text-3xl font-extrabold tracking-wider text-white mt-1">
            LEVEL UP
          </h2>

          {/* Level Transition: 1 -> 2 */}
          <div className="mt-3 inline-flex items-center gap-3 rounded-xl border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-4 py-1.5">
            <span className="font-rpg text-lg font-bold text-[var(--xp-text-muted)]">
              Level {prevLevel}
            </span>
            <ArrowRight className="h-4 w-4 text-[var(--xp-gold)]" />
            <span className="font-rpg text-xl font-extrabold text-[var(--xp-gold)]">
              Level {level}
            </span>
          </div>

          <p className="text-xs text-[var(--xp-text-muted)] font-serif italic mt-3">
            Real life gave you XP. Your legend grows stronger.
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="xp-btn-gold mt-2 px-6 py-2.5 text-xs font-bold w-full cursor-pointer"
        >
          Claim Glory
        </button>
      </div>
    </div>
  );
}
