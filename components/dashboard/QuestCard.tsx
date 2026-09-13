// components/dashboard/QuestCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Coins,
  Sparkles,
  Dumbbell,
  Brain,
  Target,
  HeartPulse,
  Palette,
  Star,
  Swords,
  Clock,
  Skull,
  Flame,
  AlertTriangle,
  Timer,
  Loader2,
} from "lucide-react";
import type { Quest } from "@/types/dashboard";
import type { CompleteQuestResult } from "@/app/actions/quests";
import { getMissedDeadlineInfo } from "@/lib/dashboard/character-adapter";

interface QuestCardProps {
  quest: Quest;
  completed?: boolean;
  pending?: boolean;
  isImportant?: boolean;
  onToggleImportant?: (questId: string) => void;
  onComplete?: (quest: Quest) => Promise<CompleteQuestResult | boolean | void | null> | CompleteQuestResult | boolean | void | null;
}

const CATEGORY_CONFIG = {
  strength: {
    icon: Dumbbell,
    label: "Strength",
    color: "var(--xp-ember)",
    bg: "rgba(249, 115, 22, 0.12)",
    border: "rgba(249, 115, 22, 0.3)",
  },
  intelligence: {
    icon: Brain,
    label: "Intelligence",
    color: "var(--xp-arcane)",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.3)",
  },
  discipline: {
    icon: Target,
    label: "Discipline",
    color: "var(--xp-discipline)",
    bg: "rgba(229, 184, 105, 0.12)",
    border: "rgba(229, 184, 105, 0.3)",
  },
  health: {
    icon: HeartPulse,
    label: "Health",
    color: "var(--xp-vital)",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
  },
  creativity: {
    icon: Palette,
    label: "Creativity",
    color: "var(--xp-creative)",
    bg: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.3)",
  },
} as const;

const FREQUENCY_LABEL: Record<Quest["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  once: "Once",
};

// Scatter for the particle burst on completion
const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return {
    tx: Math.cos(angle) * 32,
    ty: Math.sin(angle) * 32,
    delay: i * 25,
  };
});

function formatKolkataTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "";
  }
}

function getRemainingTime(deadlineIso: string, nowMs: number = Date.now()): {
  label: string;
  isExpired: boolean;
  isUrgent: boolean;
  isCritical: boolean;
} {
  const diffMs = new Date(deadlineIso).getTime() - nowMs;
  if (diffMs <= 0) {
    return { label: "Expired", isExpired: true, isUrgent: false, isCritical: false };
  }
  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const isCritical = diffSec <= 600; // <= 10 minutes
  const isUrgent = diffSec <= 3600;  // <= 60 minutes

  if (isCritical) {
    const padM = String(minutes).padStart(2, "0");
    const padS = String(seconds).padStart(2, "0");
    return {
      label: `${padM}m ${padS}s remaining`,
      isExpired: false,
      isUrgent: true,
      isCritical: true,
    };
  }

  if (isUrgent) {
    return {
      label: `${minutes}m remaining`,
      isExpired: false,
      isUrgent: true,
      isCritical: false,
    };
  }

  if (days > 0) {
    return {
      label: `${days}d ${hours}h remaining`,
      isExpired: false,
      isUrgent: false,
      isCritical: false,
    };
  }

  return {
    label: `${hours}h ${minutes}m remaining`,
    isExpired: false,
    isUrgent: false,
    isCritical: false,
  };
}

export function QuestCard({
  quest,
  completed: controlledCompleted,
  pending,
  isImportant = false,
  onToggleImportant,
  onComplete,
}: QuestCardProps) {
  const isControlled = controlledCompleted !== undefined;
  const [internalCompleted, setInternalCompleted] = useState(quest.completed);
  const completed = isControlled ? controlledCompleted : internalCompleted;

  const [submitting, setSubmitting] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Live countdown state
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!quest.deadlineAt || completed) return;

    // Check if under 10 minutes to tick every second
    const diffMs = new Date(quest.deadlineAt).getTime() - Date.now();
    const isUnder10Min = diffMs > 0 && diffMs <= 600000;
    const intervalMs = isUnder10Min ? 1000 : 15000;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => clearInterval(interval);
  }, [quest.deadlineAt, completed]);

  const meta = CATEGORY_CONFIG[quest.category] ?? CATEGORY_CONFIG.discipline;
  const Icon = meta.icon;

  const isBoss = quest.questType === "boss";
  const isCustomDate = quest.questType === "habit" && Boolean(quest.deadlineAt);

  const countdown = quest.deadlineAt
    ? getRemainingTime(quest.deadlineAt, now)
    : null;

  const isExpired = countdown?.isExpired ?? false;
  const missedInfo = !completed && quest.deadlineAt ? getMissedDeadlineInfo(quest, now) : null;
  const hasPenalty = Boolean(quest.penalty || missedInfo?.isMissed);
  const penaltyDaysLate = quest.penalty?.daysLate ?? missedInfo?.daysLate ?? 1;
  const penaltyAmount = quest.penalty?.penaltyAmount ?? missedInfo?.penaltyAmount ?? 15;

  async function handleComplete() {
    if (completed || pending || submitting || isExpired) return;
    setSubmitting(true);

    try {
      if (onComplete) {
        const success = await onComplete(quest);
        if (success) {
          if (!isControlled) setInternalCompleted(true);
          setBursting(true);
          setShowPopup(true);
          window.setTimeout(() => setBursting(false), 750);
          window.setTimeout(() => setShowPopup(false), 1150);
        }
      } else {
        if (!isControlled) setInternalCompleted(true);
        setBursting(true);
        setShowPopup(true);
        window.setTimeout(() => setBursting(false), 750);
        window.setTimeout(() => setShowPopup(false), 1150);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Determine container styling based on Boss / Important / Completed / Expired
  const containerStyle = completed
    ? "border-emerald-500/20 bg-[#081313]/60 opacity-80"
    : isExpired
    ? "border-red-900/30 bg-[#12080a]/60 opacity-60"
    : isBoss
    ? "border-red-500/40 bg-gradient-to-r from-red-950/30 via-[#101424] to-[#080C14] shadow-md shadow-red-950/40 hover:border-red-400"
    : isImportant
    ? "border-[var(--xp-border-gold)] bg-gradient-to-r from-[var(--xp-gold)]/[0.07] via-[var(--xp-void-raised)] to-[var(--xp-panel)] shadow-sm shadow-[var(--xp-gold)]/5 hover:border-[var(--xp-gold)]"
    : "border-white/[0.07] bg-[var(--xp-panel)]/80 hover:border-white/20 hover:bg-[var(--xp-panel-raised)]";

  const bonusXp = quest.bonusXpReward ?? 0;
  const bonusGold = quest.bonusGoldReward ?? 0;
  const totalXp = quest.xpReward + (isBoss ? bonusXp : 0);
  const totalGold = quest.goldReward + (isBoss ? bonusGold : 0);

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border p-3.5 transition-all duration-200 ${containerStyle}`}
    >
      {/* Left: Category/Boss Icon + Title + Lore/Description + Badges */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* RPG Icon (Swords for Boss, Category Icon for Regular) */}
        <div
          className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
            isBoss && !completed
              ? "border-red-500/50 bg-red-950/40 text-red-400 shadow-sm shadow-red-900/30"
              : ""
          }`}
          style={
            !isBoss
              ? {
                  backgroundColor: meta.bg,
                  borderColor: meta.border,
                }
              : undefined
          }
        >
          {isBoss ? (
            <Swords className="h-5 w-5 text-red-400" />
          ) : (
            <Icon className="h-5 w-5" style={{ color: meta.color }} />
          )}
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-semibold leading-snug transition-colors ${
                completed
                  ? "text-[var(--xp-text-muted)] line-through decoration-emerald-500/40"
                  : isBoss
                  ? "text-red-100 font-bold group-hover:text-white"
                  : "text-[var(--xp-text)] group-hover:text-white"
              }`}
            >
              {quest.title}
            </h4>

            {/* Badges */}
            {isBoss && !completed && !isExpired && (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-red-400">
                <Flame className="h-3 w-3 text-red-400" />
                Boss Event
              </span>
            )}

            {isBoss && isExpired && !completed && (
              <span className="rounded-md border border-red-900/40 bg-red-950/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-red-500">
                Boss Escaped
              </span>
            )}

            {isBoss && completed && (
              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
                Boss Slain
              </span>
            )}

            {isCustomDate && !completed && !isExpired && (
              <span className="rounded-md border border-sky-500/30 bg-sky-500/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-sky-300">
                Custom Date
              </span>
            )}

            {!isBoss && isExpired && !completed && (
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-red-400">
                Expired
              </span>
            )}

            {isImportant && !completed && !isExpired && !isBoss && (
              <span className="rounded-md border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-[var(--xp-gold)]">
                Important
              </span>
            )}

            {!isBoss && completed && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
                Completed
              </span>
            )}

            {/* Missed deadline warning or countdown badge */}
            {hasPenalty && !completed ? (
              isBoss ? (
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-red-500/50 bg-red-950/40 text-red-300 shadow-sm shadow-red-950/40"
                  title={quest.deadlineAt ? formatKolkataTime(quest.deadlineAt) : ""}
                >
                  <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                  <span>⚠ DEADLINE MISSED — Progress Penalty: -{penaltyAmount}</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-red-500/40 bg-red-950/30 text-red-300"
                  title={quest.deadlineAt ? formatKolkataTime(quest.deadlineAt) : ""}
                >
                  <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                  <span>
                    MISSED DEADLINE • {penaltyDaysLate} {penaltyDaysLate === 1 ? "DAY" : "DAYS"} LATE • -{penaltyAmount} PROGRESS
                  </span>
                </span>
              )
            ) : countdown && !completed ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-[10px] font-medium border tabular-nums transition-colors ${
                  countdown.isExpired
                    ? "border-red-900/30 bg-red-950/30 text-red-400/80"
                    : countdown.isCritical
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                    : countdown.isUrgent
                    ? "border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)]"
                    : "border-white/10 bg-white/5 text-[var(--xp-text-muted)]"
                }`}
                title={quest.deadlineAt ? formatKolkataTime(quest.deadlineAt) : ""}
              >
                <Clock className="h-3 w-3" />
                {countdown.isExpired ? "Deadline Passed" : countdown.label}
              </span>
            ) : null}
          </div>

          {quest.description && (
            <p className="text-xs text-[var(--xp-text-muted)] line-clamp-1 mt-0.5">
              {quest.description}
            </p>
          )}

          {/* Chips on mobile */}
          <div className="flex sm:hidden items-center gap-2 mt-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
              style={{
                color: meta.color,
                backgroundColor: meta.bg,
                borderColor: meta.border,
              }}
            >
              {meta.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[var(--xp-text-muted)]">
              {isBoss ? "Boss" : FREQUENCY_LABEL[quest.frequency]}
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right: Chips + Rewards + Completion Button */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
        {/* Chips on desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-semibold border"
            style={{
              color: meta.color,
              backgroundColor: meta.bg,
              borderColor: meta.border,
            }}
          >
            {meta.label}
          </span>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[var(--xp-text-muted)]">
            {isBoss ? "Boss Event" : FREQUENCY_LABEL[quest.frequency]}
          </span>
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
          <span
            className="flex items-center gap-1 text-[#A78BFA]"
            title={
              isBoss
                ? `Base: +${quest.xpReward} XP, Boss Bonus: +${bonusXp} XP`
                : "XP Reward"
            }
          >
            <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
            +{totalXp} XP
            {isBoss && bonusXp > 0 && (
              <span className="text-[10px] text-[#DDD6FE] font-normal">
                (+{bonusXp})
              </span>
            )}
          </span>

          <span
            className="flex items-center gap-1 text-[var(--xp-gold)]"
            title={
              isBoss
                ? `Base: +${quest.goldReward}, Boss Bonus: +${bonusGold}`
                : "Gold Reward"
            }
          >
            <Coins className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
            +{totalGold}
            {isBoss && bonusGold > 0 && (
              <span className="text-[10px] text-[var(--xp-gold-bright)] font-normal">
                (+{bonusGold})
              </span>
            )}
          </span>
        </div>

        {/* Actions Cluster: Star Pin + Action Button */}
        <div className="flex items-center gap-2">
          {onToggleImportant && !isBoss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleImportant(quest.id);
              }}
              aria-label={isImportant ? "Unmark as important" : "Mark as important"}
              className={`p-1.5 rounded-lg transition-colors ${
                isImportant
                  ? "text-[var(--xp-gold)] hover:bg-[var(--xp-gold)]/10"
                  : "text-[var(--xp-text-faint)] hover:text-[var(--xp-gold)] hover:bg-white/5"
              }`}
            >
              <Star
                className="h-4 w-4"
                fill={isImportant ? "var(--xp-gold)" : "none"}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Focus Mode Button for Active Quests */}
          {!completed && !isExpired && (
            <Link
              href={`/protected/focus?questId=${quest.id}`}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0E1526] hover:border-[var(--xp-border-gold)] hover:text-[var(--xp-gold)] px-2.5 py-1 text-[11px] font-bold text-[var(--xp-text-muted)] transition-all cursor-pointer"
              title={`Focus on ${quest.title}`}
            >
              <Timer className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
              <span>Focus</span>
            </Link>
          )}

          {/* Special Combat Defeat Button for Boss Quests */}
          {isBoss ? (
            <div className="relative">
              {completed ? (
                <div className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400">
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Defeated</span>
                </div>
              ) : isExpired ? (
                <div className="flex items-center gap-1 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-500/60 cursor-not-allowed">
                  <span>Escaped</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={pending || submitting}
                  className="relative flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-md shadow-red-700/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting || pending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Defeating Boss...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="h-3.5 w-3.5" />
                      <span>Defeat Boss</span>
                    </>
                  )}
                </button>
              )}

              {bursting && (
                <span className="xp-complete-burst" aria-hidden="true">
                  {PARTICLES.map((p, i) => (
                    <span
                      key={i}
                      style={
                        {
                          "--tx": `${p.tx * 1.5}px`,
                          "--ty": `${p.ty * 1.5}px`,
                          animationDelay: `${p.delay}ms`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </span>
              )}
            </div>
          ) : (
            /* Interactive RPG Checkbox for Regular Quests */
            <div className="relative">
              <button
                type="button"
                onClick={handleComplete}
                disabled={completed || pending || submitting || isExpired}
                aria-label={
                  completed
                    ? "Quest Completed"
                    : isExpired
                    ? "Quest Expired"
                    : submitting || pending
                    ? "Completing Quest..."
                    : `Complete quest: ${quest.title}`
                }
                className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-all duration-200 ${
                  completed
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/30 cursor-default"
                    : isExpired
                    ? "border-red-900/30 bg-[#0c0507] text-red-700 cursor-not-allowed"
                    : submitting || pending
                    ? "border-[var(--xp-border-gold)] bg-[#080C14] text-[var(--xp-gold)] cursor-wait"
                    : "border-white/20 bg-[#080C14] text-transparent hover:border-[var(--xp-gold)] hover:shadow-md hover:shadow-[var(--xp-gold)]/20 active:scale-95 cursor-pointer"
                }`}
              >
                {submitting || pending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--xp-gold)]" />
                ) : (
                  <Check
                    className={`h-4 w-4 stroke-[3] transition-all ${
                      completed ? "opacity-100 text-white" : "opacity-0"
                    }`}
                  />
                )}
              </button>

              {/* Particle Burst on completion */}
              {bursting && (
                <span className="xp-complete-burst" aria-hidden="true">
                  {PARTICLES.map((p, i) => (
                    <span
                      key={i}
                      style={
                        {
                          "--tx": `${p.tx}px`,
                          "--ty": `${p.ty}px`,
                          animationDelay: `${p.delay}ms`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating XP & Gold Reward Popups */}
      {showPopup && (
        <div className="pointer-events-none absolute right-4 -top-3 z-30 flex items-center gap-2 font-rpg text-xs sm:text-sm font-extrabold">
          <span className="xp-float-xp flex items-center gap-1 rounded-full border border-[var(--xp-arcane)]/40 bg-[#080C14]/90 px-2 py-0.5 text-[var(--xp-arcane)] shadow-lg shadow-[var(--xp-arcane)]/20">
            <Sparkles className="h-3.5 w-3.5 text-[var(--xp-arcane)]" />
            +{totalXp} XP
          </span>
          <span className="xp-float-gold flex items-center gap-1 rounded-full border border-[var(--xp-border-gold)] bg-[#080C14]/90 px-2 py-0.5 text-[var(--xp-gold)] shadow-lg shadow-[var(--xp-gold)]/20">
            <Coins className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
            +{totalGold} Gold
          </span>
        </div>
      )}
    </div>
  );
}
