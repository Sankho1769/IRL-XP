// components/dashboard/BossVictoryOverlay.tsx
"use client";

import React, { useEffect } from "react";
import { Sparkles, Coins, Trophy, Swords, Crown } from "lucide-react";
import type { CompleteQuestResult } from "@/app/actions/quests";

interface BossVictoryOverlayProps {
  victory: (CompleteQuestResult & { questTitle: string }) | null;
  onClose: () => void;
}

export function BossVictoryOverlay({ victory, onClose }: BossVictoryOverlayProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (victory) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [victory, onClose]);

  if (!victory) return null;

  const baseXP = victory.xpAwarded - victory.bonusXpAwarded;
  const baseGold = victory.goldAwarded - victory.bonusGoldAwarded;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-victory-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
    >
      {/* Short Warm Gold Flash Vignette */}
      <div
        className="xp-flash-burst pointer-events-none absolute inset-0 bg-[var(--xp-gold)]/25"
        aria-hidden="true"
      />

      {/* Floating Ember Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span
          className="xp-ember-particle absolute left-[20%] bottom-[30%] h-2 w-2 rounded-full bg-[var(--xp-gold)]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="xp-ember-particle absolute right-[25%] bottom-[35%] h-1.5 w-1.5 rounded-full bg-[#F97316]"
          style={{ animationDelay: "600ms" }}
        />
        <span
          className="xp-ember-particle absolute left-[35%] bottom-[20%] h-2.5 w-2.5 rounded-full bg-[#F5C362]"
          style={{ animationDelay: "1200ms" }}
        />
        <span
          className="xp-ember-particle absolute right-[35%] bottom-[25%] h-1 w-1 rounded-full bg-[var(--xp-gold)]"
          style={{ animationDelay: "900ms" }}
        />
      </div>

      <div
        className="relative w-full max-w-md sm:max-w-lg rounded-2xl border-2 border-[var(--xp-gold)] bg-gradient-to-b from-[#180E24] via-[#0E1526] to-[#080C14] p-5 sm:p-8 text-center shadow-2xl shadow-[var(--xp-gold)]/25 animate-in zoom-in-95 duration-300 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect behind icon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-[var(--xp-gold)]/25 blur-xl absolute" />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--xp-gold)] bg-[#0B0F1C] shadow-lg shadow-[var(--xp-gold)]/40 text-[var(--xp-gold)]">
            <Swords className="h-8 w-8 text-[var(--xp-gold)]" />
          </div>
        </div>

        {/* Header */}
        <div className="mt-7">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)]">
            <Trophy className="h-3 w-3" />
            Legendary Triumph
          </div>
          <h2
            id="boss-victory-title"
            className="font-rpg text-2xl sm:text-3xl font-extrabold tracking-wider text-white mt-2"
          >
            ⚔ BOSS DEFEATED ⚔
          </h2>
          <p className="text-sm font-semibold text-[var(--xp-gold)] font-serif italic mt-1">
            &ldquo;{victory.questTitle}&rdquo;
          </p>
          <p className="text-xs text-[var(--xp-text-muted)] mt-1">
            You stood firm against the deadline and conquered the challenge.
          </p>
        </div>

        {/* Authoritative Spoils Breakdown Box */}
        <div className="mt-5 rounded-xl border border-white/10 bg-[#080C14]/90 p-4 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--xp-text-muted)]">
              Spoils of Victory
            </h3>
            <span className="text-[10px] font-semibold text-[var(--xp-gold)]">
              Server Verified
            </span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            {/* Base Reward Row */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-[var(--xp-text-muted)] font-medium">BASE REWARD</span>
              <div className="flex items-center gap-3 font-semibold">
                <span className="text-[#C4B5FD]">+{baseXP} XP</span>
                <span className="text-[var(--xp-gold)]">+{baseGold} Gold</span>
              </div>
            </div>

            {/* Boss Bonus Row */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-red-300 font-bold flex items-center gap-1">
                <span>BOSS BONUS</span>
              </span>
              <div className="flex items-center gap-3 font-bold">
                <span className="text-[#A78BFA]">+{victory.bonusXpAwarded} XP</span>
                <span className="text-[var(--xp-gold-bright)]">+{victory.bonusGoldAwarded} Gold</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex items-center justify-between pt-1.5 font-rpg text-sm font-extrabold">
              <span className="text-white tracking-wider">TOTAL</span>
              <div className="flex items-center gap-3">
                <span className="text-[#C4B5FD] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
                  +{victory.xpAwarded} XP
                </span>
                <span className="text-[var(--xp-gold)] flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
                  +{victory.goldAwarded} Gold
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Up Banner if applicable */}
        {victory.didLevelUp && (
          <div className="mt-4 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 p-3 flex items-center justify-center gap-2 text-amber-300 font-bold">
            <Crown className="h-5 w-5 animate-bounce" />
            <span className="font-rpg text-sm tracking-wide">
              LEVEL UP! REACHED LEVEL {victory.newLevel}!
            </span>
          </div>
        )}

        {/* Claim Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="xp-btn-gold w-full py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-[var(--xp-gold)]/20 cursor-pointer"
          >
            Claim Spoils & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
