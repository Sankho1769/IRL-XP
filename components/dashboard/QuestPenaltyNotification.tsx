// components/dashboard/QuestPenaltyNotification.tsx
"use client";

import React, { useEffect, useId } from "react";
import { AlertTriangle, Skull, X, ShieldAlert } from "lucide-react";
import type { ProcessedPenalty } from "@/app/actions/quests";

interface QuestPenaltyNotificationProps {
  penalty: ProcessedPenalty | null;
  onDismiss: () => void;
}

export function QuestPenaltyNotification({
  penalty,
  onDismiss,
}: QuestPenaltyNotificationProps) {
  const titleId = useId();
  const descId = useId();

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!penalty) return;
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [penalty, onDismiss]);

  // Keyboard accessibility: Escape to dismiss
  useEffect(() => {
    if (!penalty) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onDismiss();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [penalty, onDismiss]);

  if (!penalty) return null;

  const isBoss = penalty.isBoss;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      {/* Crimson Danger Glow in background */}
      <div
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-red-600/15 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="xp-panel relative flex flex-col items-center gap-4 px-6 py-7 sm:px-8 sm:py-8 text-center max-w-sm w-full border border-red-500/40 bg-[#12080D]/95 shadow-[0_0_35px_rgba(220,38,38,0.3)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss penalty alert"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon Emblem */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/50 bg-red-950/40 text-red-400 shadow-lg shadow-red-950/60">
          {isBoss ? (
            <Skull className="h-7 w-7 animate-pulse text-red-400" />
          ) : (
            <AlertTriangle className="h-7 w-7 text-red-400" />
          )}
        </div>

        {/* Header Ribbon */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest border border-red-500/40 bg-red-950/30 text-red-400">
          <ShieldAlert className="h-3 w-3" />
          <span>{isBoss ? "⚠ Deadline Missed" : "Quest Penalty"}</span>
        </div>

        {/* Quest Title */}
        <div>
          <h3
            id={titleId}
            className="font-rpg text-xl font-bold text-[var(--xp-text)] leading-tight"
          >
            {penalty.questTitle}
          </h3>
          <p id={descId} className="text-xs text-[var(--xp-text-muted)] mt-1 font-serif italic">
            {penalty.daysLate} {penalty.daysLate === 1 ? "day" : "days"} overdue in the realm.
          </p>
        </div>

        {/* Penalty Stat Box */}
        <div className="w-full flex items-center justify-around rounded-xl border border-red-500/30 bg-red-950/20 py-3 px-4 my-1">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-red-400/80 tracking-wider">
              Elapsed
            </span>
            <span className="font-rpg text-base font-bold text-red-300">
              {penalty.daysLate} {penalty.daysLate === 1 ? "Day Late" : "Days Late"}
            </span>
          </div>
          <div className="h-8 w-px bg-red-500/20" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-red-400/80 tracking-wider">
              Penalty
            </span>
            <span className="font-rpg text-base font-extrabold text-red-400 tabular-nums">
              -{penalty.penaltyAmount} Progress
            </span>
          </div>
        </div>

        {/* Reassurance note */}
        <p className="text-[11px] text-[var(--xp-text-faint)] max-w-xs">
          Quest integrity reduced to {penalty.newProgress}%. Global player XP and level are unaffected.
        </p>

        {/* Acknowledge Button */}
        <button
          type="button"
          onClick={onDismiss}
          autoFocus
          className="w-full mt-1 py-2.5 rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 text-xs font-bold uppercase tracking-wider text-red-200 transition-colors shadow-sm"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
