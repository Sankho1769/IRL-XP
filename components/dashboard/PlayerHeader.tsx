// components/dashboard/PlayerHeader.tsx
"use client";

import React from "react";
import { Coins, Sparkles } from "lucide-react";
import type { Player } from "@/types/dashboard";
import { XPBar } from "./XPBar";

interface PlayerHeaderProps {
  player: Player;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerHeader({ player }: PlayerHeaderProps) {
  return (
    <section
      className="xp-panel flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:gap-6 border border-[var(--xp-border-gold)]/30"
      aria-label="Player summary"
    >
      {/* Avatar */}
      <div className="flex items-center gap-4 md:gap-5">
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--xp-border-gold)] bg-gradient-to-br from-[var(--xp-gold)]/20 via-[#0D1322] to-[#111827] text-lg font-bold text-[var(--xp-gold)] sm:h-20 sm:w-20 sm:text-xl shadow-lg"
          aria-hidden="true"
        >
          {player.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.avatarUrl}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <span>{initials(player.name)}</span>
          )}
          <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#111827] bg-[var(--xp-gold)] text-[11px] font-extrabold text-[#080C14] shadow-md">
            {player.level}
          </span>
        </div>

        <div className="min-w-0">
          <h1 className="truncate font-rpg text-lg font-bold text-[var(--xp-text)] sm:text-xl">
            {player.name}
          </h1>
          <p className="text-xs font-medium text-[var(--xp-gold)] font-serif italic">{player.title}</p>
        </div>
      </div>

      {/* XP progress */}
      <div className="flex-1 md:px-2">
        <XPBar
          currentXP={player.currentXP}
          xpToNextLevel={player.xpToNextLevel}
          label={`Level ${player.level}`}
        />
      </div>

      {/* Gold */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-4 py-2.5 md:justify-center">
        <span className="text-xs text-[var(--xp-text-muted)] md:hidden">
          Gold
        </span>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-[var(--xp-gold)]" aria-hidden="true" />
          <span className="font-rpg font-bold tabular-nums text-[var(--xp-gold)]">
            {player.gold.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
}
