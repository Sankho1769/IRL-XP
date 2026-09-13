// components/dashboard/QuestBoardView.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Swords,
  Sun,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  Plus,
  Flame,
  MoreVertical,
  Trash2,
  X,
  RotateCcw,
  GripVertical,
  Move,
} from "lucide-react";
import type { Quest } from "@/types/dashboard";
import type { CompleteQuestResult } from "@/app/actions/quests";
import { QuestBoardCard } from "./QuestBoardCard";
import { getMissedDeadlineInfo, isQuestExpired } from "@/lib/dashboard/character-adapter";

interface QuestBoardViewProps {
  quests: Quest[];
  activeFilter?: string;
  completedQuestIds: Set<string>;
  importantQuestIds: Set<string>;
  toggleImportantQuest: (questId: string) => void;
  handleQuestComplete: (quest: Quest) => Promise<CompleteQuestResult | boolean | void | null> | CompleteQuestResult | boolean | void | null;
  pendingQuestId: string | null;
  onOpenNewQuestModal?: () => void;
  onDelete?: (questId: string) => Promise<boolean | void> | boolean | void;
}

function getRemainingTimeText(deadlineAt: string | null | undefined, nowMs: number): string | null {
  if (!deadlineAt) return null;
  const target = new Date(deadlineAt).getTime();
  const diff = target - nowMs;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

/**
 * Large-screen only decorative SVG filigree corners
 */
function CornerFiligree({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`hidden lg:block pointer-events-none ${className}`}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 14V6a4 4 0 0 1 4-4h8" />
      <path d="M2 6h6a2 2 0 0 0 2-2V2" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Large-screen only winged sword crest
 */
function GuildCrestIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`hidden lg:block pointer-events-none ${className}`}
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 4L12 10v14c0 10 12 18 12 18s12-8 12-18V10L24 4z" fill="currentColor" fillOpacity="0.08" />
      <path d="M24 10v26" />
      <path d="M18 16l12 12" />
      <path d="M30 16L18 28" />
      <circle cx="24" cy="22" r="2.5" />
      <path d="M8 20c-3-2-6-1-6 2 0 4 5 7 10 8" opacity="0.6" />
      <path d="M40 20c3-2 6-1 6 2 0 4-5 7-10 8" opacity="0.6" />
    </svg>
  );
}

export function QuestBoardView({
  quests,
  activeFilter = "all",
  completedQuestIds,
  importantQuestIds,
  toggleImportantQuest,
  handleQuestComplete,
  pendingQuestId,
  onOpenNewQuestModal,
  onDelete,
}: QuestBoardViewProps) {
  const router = useRouter();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [bossMenuOpenId, setBossMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmBossId, setDeleteConfirmBossId] = useState<string | null>(null);
  const [isDeletingBoss, setIsDeletingBoss] = useState(false);
  const bossMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close boss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bossMenuRef.current && !bossMenuRef.current.contains(e.target as Node)) {
        setBossMenuOpenId(null);
      }
    }
    if (bossMenuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [bossMenuOpenId]);

  // 1. Authoritative Classification
  const activeBossQuests = quests.filter(
    (q) => q.questType === "boss" && !q.completed && !completedQuestIds.has(q.id)
  );

  const activeNormalQuests = quests.filter(
    (q) => q.questType !== "boss" && !q.completed && !completedQuestIds.has(q.id)
  );

  // Sort quests by Importance first, then by Less Time remaining (earliest deadlineAt)
  const sortQuestsByImpAndTime = useCallback((list: Quest[]) => {
    return [...list].sort((a, b) => {
      // 1. Important (imp) quests first
      const aImp = importantQuestIds.has(a.id);
      const bImp = importantQuestIds.has(b.id);
      if (aImp && !bImp) return -1;
      if (!aImp && bImp) return 1;

      // 2. Less time remaining (earlier deadline) first
      const aTime = a.deadlineAt ? new Date(a.deadlineAt).getTime() : null;
      const bTime = b.deadlineAt ? new Date(b.deadlineAt).getTime() : null;

      if (aTime !== null && bTime !== null) {
        if (aTime !== bTime) return aTime - bTime;
      } else if (aTime !== null && bTime === null) {
        return -1; // Closer deadline comes first
      } else if (aTime === null && bTime !== null) {
        return 1;
      }

      // 3. Alphabetical fallback
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [importantQuestIds]);

  const todayQuests = useMemo(
    () => sortQuestsByImpAndTime(activeNormalQuests.filter((q) => q.frequency === "daily")),
    [activeNormalQuests, sortQuestsByImpAndTime]
  );
  const thisWeekQuests = useMemo(
    () => sortQuestsByImpAndTime(activeNormalQuests.filter((q) => q.frequency === "weekly")),
    [activeNormalQuests, sortQuestsByImpAndTime]
  );
  const oneTimeQuests = useMemo(
    () => sortQuestsByImpAndTime(activeNormalQuests.filter((q) => q.frequency !== "daily" && q.frequency !== "weekly")),
    [activeNormalQuests, sortQuestsByImpAndTime]
  );

  const completedQuests = useMemo(
    () => sortQuestsByImpAndTime(quests.filter((q) => q.completed || completedQuestIds.has(q.id))),
    [quests, completedQuestIds, sortQuestsByImpAndTime]
  );

  // Sticky Notes Drag & Drop / Move state
  const [stickyPositions, setStickyPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [stickyOrder, setStickyOrder] = useState<string[]>([]);
  const [draggingStickyId, setDraggingStickyId] = useState<string | null>(null);
  const [dragCurrentOffset, setDragCurrentOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dropTargetStickyId, setDropTargetStickyId] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Load saved sticky layout from localStorage on mount
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem("irl_xp_sticky_positions_v1");
      if (savedPos) setStickyPositions(JSON.parse(savedPos));
      const savedOrder = localStorage.getItem("irl_xp_sticky_order_v1");
      if (savedOrder) setStickyOrder(JSON.parse(savedOrder));
    } catch {
      // ignore
    }
  }, []);

  const saveStickyPositions = (pos: Record<string, { x: number; y: number }>) => {
    setStickyPositions(pos);
    try {
      localStorage.setItem("irl_xp_sticky_positions_v1", JSON.stringify(pos));
    } catch {}
  };

  const saveStickyOrder = (order: string[]) => {
    setStickyOrder(order);
    try {
      localStorage.setItem("irl_xp_sticky_order_v1", JSON.stringify(order));
    } catch {}
  };

  const handleResetStickyLayout = () => {
    setStickyPositions({});
    setStickyOrder([]);
    try {
      localStorage.removeItem("irl_xp_sticky_positions_v1");
      localStorage.removeItem("irl_xp_sticky_order_v1");
    } catch {}
  };

  // Re-ordered completed quests list based on custom user ordering or sorted by imp & less time
  const sortedCompletedQuests = useMemo(() => {
    if (stickyOrder.length === 0) return completedQuests;

    const map = new Map(completedQuests.map((q) => [q.id, q]));
    const ordered: Quest[] = [];

    for (const id of stickyOrder) {
      const q = map.get(id);
      if (q) {
        ordered.push(q);
        map.delete(id);
      }
    }
    const remaining = sortQuestsByImpAndTime(Array.from(map.values()));
    for (const q of remaining) {
      ordered.push(q);
    }
    return ordered;
  }, [completedQuests, stickyOrder, sortQuestsByImpAndTime]);

  const handleStickyPointerDown = (e: React.PointerEvent, questId: string) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest('[role="menu"]')) {
      return;
    }

    const currentPos = stickyPositions[questId] || { x: 0, y: 0 };
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialOffsetRef.current = currentPos;
    hasMovedRef.current = false;
    setDragCurrentOffset(currentPos);
    setDraggingStickyId(questId);
    setDropTargetStickyId(null);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleStickyPointerMove = (e: React.PointerEvent) => {
    if (!draggingStickyId) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }

    const newX = initialOffsetRef.current.x + dx;
    const newY = initialOffsetRef.current.y + dy;
    setDragCurrentOffset({ x: newX, y: newY });

    const elem = document.elementFromPoint(e.clientX, e.clientY);
    const targetCard = elem?.closest("[data-sticky-id]") as HTMLElement | null;
    const targetId = targetCard?.getAttribute("data-sticky-id");
    if (targetId && targetId !== draggingStickyId) {
      setDropTargetStickyId(targetId);
    } else {
      setDropTargetStickyId(null);
    }
  };

  const handleStickyPointerUp = (e: React.PointerEvent) => {
    if (!draggingStickyId) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const draggedId = draggingStickyId;
    const targetId = dropTargetStickyId;

    if (targetId && targetId !== draggedId) {
      const currentList = sortedCompletedQuests.map((q) => q.id);
      const fromIdx = currentList.indexOf(draggedId);
      const toIdx = currentList.indexOf(targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const updated = [...currentList];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        saveStickyOrder(updated);

        const updatedPos = { ...stickyPositions };
        delete updatedPos[draggedId];
        delete updatedPos[targetId];
        saveStickyPositions(updatedPos);
      }
    } else if (hasMovedRef.current) {
      saveStickyPositions({
        ...stickyPositions,
        [draggedId]: dragCurrentOffset,
      });
    }

    setDraggingStickyId(null);
    setDropTargetStickyId(null);
  };


  const handleDeleteBoss = async (bossId: string) => {
    if (!onDelete) return;
    setIsDeletingBoss(true);
    try {
      await onDelete(bossId);
      setDeleteConfirmBossId(null);
      setBossMenuOpenId(null);
    } finally {
      setIsDeletingBoss(false);
    }
  };

  // Determine section visibility based on activeFilter
  const showBoss = activeFilter === "all" || activeFilter === "boss" || (activeFilter === "important" && activeBossQuests.length > 0);
  const showColumns = activeFilter === "all" || activeFilter === "daily" || activeFilter === "weekly" || activeFilter === "custom" || activeFilter === "important";
  const showCompleted = (activeFilter === "all" && completedQuests.length > 0) || activeFilter === "completed";

  return (
    <div className="relative flex flex-col gap-6 pb-10">
      {/* 1. BOSS EVENT SECTION */}
      {showBoss && (
        <section role="region" aria-label="Boss Events" className="flex flex-col relative">
          {/* Ornate Boss Event Header */}
          <div className="flex flex-col items-center justify-center gap-1 mb-4 text-center">
            <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-amber-500/40" />
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                <GuildCrestIcon className="text-amber-400" />
                <Swords className="h-4 w-4 text-amber-400" />
                <span>BOSS EVENT</span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-amber-500/20 to-amber-500/40" />
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--xp-text-muted)] font-serif italic">
              A greater test challenge. A greater you.
            </p>
          </div>

          {activeBossQuests.length === 0 ? (
            /* Empty Boss Banner with Atmospheric Dragon Artwork */
            <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-[#0E0B14] p-6 sm:p-8 text-center backdrop-blur-md shadow-2xl group">
              {/* Atmospheric Dark Fantasy Background Image */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/boss_dragon.jpg"
                  alt="Boss Dragon Encounter"
                  className="h-full w-full object-cover object-[center_35%] opacity-75 filter brightness-100 contrast-125 scale-105 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C14]/50 via-[#0A0F1D]/30 to-[#080B14]/65" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080C14_80%)]" />
              </div>

              <CornerFiligree className="absolute top-2 left-2 text-amber-500/40" />
              <CornerFiligree className="absolute top-2 right-2 text-amber-500/40 -scale-x-100" />
              <CornerFiligree className="absolute bottom-2 left-2 text-amber-500/40 -scale-y-100" />
              <CornerFiligree className="absolute bottom-2 right-2 text-amber-500/40 -scale-x-100 -scale-y-100" />

              <div className="relative z-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/25 via-[#162035] to-black/80 text-amber-300 mb-3 shadow-[0_0_25px_rgba(245,195,98,0.25)] ring-1 ring-amber-500/20">
                  <Swords className="h-6 w-6" />
                </div>
                <h3 className="font-rpg text-base sm:text-lg font-bold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  No Boss Event Summoned
                </h3>
                <p className="text-xs text-[var(--xp-text-muted)] max-w-md mx-auto mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  Summon a Boss Event to test your endurance against real-world deadlines for high XP and Gold rewards.
                </p>
                {onOpenNewQuestModal && (
                  <button
                    type="button"
                    onClick={onOpenNewQuestModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 px-5 py-2 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/15 hover:border-amber-400/60"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Summon Boss Event</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Render Active Boss Cards */
            <div className="flex flex-col gap-5">
              {activeBossQuests.map((boss) => {
                const isExpired = isQuestExpired(boss, nowMs);
                const missedInfo = getMissedDeadlineInfo(boss, nowMs);
                const hasPenalty = Boolean(boss.penalty || missedInfo.isMissed);
                const penaltyAmount = boss.penalty?.penaltyAmount ?? missedInfo.penaltyAmount ?? 15;
                const daysLate = boss.penalty?.daysLate ?? missedInfo.daysLate ?? 0;
                const remainingText = getRemainingTimeText(boss.deadlineAt, nowMs);
                const isPending = pendingQuestId === boss.id;
                const isImportant = importantQuestIds.has(boss.id);
                const currentProgress = Math.max(0, Math.min(100, boss.progress ?? 100));

                return (
                  <div
                    key={boss.id}
                    className={`relative overflow-hidden rounded-2xl border-2 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md transition-all ${
                      hasPenalty
                        ? "border-red-600/50 bg-gradient-to-b from-[#1E0E18]/95 via-[#140B16]/95 to-[#0A060E]/95 shadow-[0_0_25px_rgba(220,38,38,0.2)]"
                        : "border-[#5C4524]/60 bg-gradient-to-b from-[#141A29]/95 via-[#0D1220]/95 to-[#080B14]/95"
                    }`}
                  >
                    {/* Large screen decorative filigree corners */}
                    <CornerFiligree className="absolute top-2 left-2 text-amber-500/30" />
                    <CornerFiligree className="absolute top-2 right-2 text-amber-500/30 -scale-x-100" />
                    <CornerFiligree className="absolute bottom-2 left-2 text-amber-500/30 -scale-y-100" />
                    <CornerFiligree className="absolute bottom-2 right-2 text-amber-500/30 -scale-x-100 -scale-y-100" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-5 md:gap-6 items-center">
                      {/* Left: Dragon Artwork */}
                      <div className="w-full md:w-60 h-60 sm:h-68 md:h-72 rounded-xl overflow-hidden border border-red-500/30 shadow-xl shadow-red-950/40 shrink-0 bg-black/50 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/boss_dragon.jpg"
                          alt={boss.title}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      {/* Right: Content & Action */}
                      <div className="flex-1 w-full flex flex-col justify-between self-stretch py-1">
                        <div>
                          {/* Top Row: Red BOSS Badge, Deadline/Missed Status, Star, Options Menu */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                                BOSS
                              </span>

                              {hasPenalty ? (
                                <div className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/60 px-3 py-1 text-xs text-red-300 font-bold tabular-nums">
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                                  <span>
                                    ⚠ DEADLINE MISSED
                                    {daysLate > 0 ? ` • ${daysLate} ${daysLate === 1 ? "DAY" : "DAYS"} LATE` : ""}
                                    {` • -${penaltyAmount}% INTEGRITY`}
                                  </span>
                                </div>
                              ) : remainingText ? (
                                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-white/90 font-medium tabular-nums">
                                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                                  <span>{remainingText} remaining</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Actions: Star + Options Menu */}
                            <div className="flex items-center gap-1.5 relative">
                              <button
                                type="button"
                                onClick={() => toggleImportantQuest(boss.id)}
                                aria-label={isImportant ? "Unpin boss quest" : "Pin boss quest"}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isImportant
                                    ? "border-amber-400/50 bg-amber-400/15 text-amber-400"
                                    : "border-white/10 bg-black/30 text-white/40 hover:text-white"
                                }`}
                              >
                                <Star className={`h-4 w-4 ${isImportant ? "fill-amber-400" : ""}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setBossMenuOpenId(bossMenuOpenId === boss.id ? null : boss.id)}
                                aria-label="Boss quest options"
                                className="p-1.5 rounded-lg border border-white/10 bg-black/30 text-white/40 hover:text-white transition-all cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Boss Dropdown Menu */}
                              {bossMenuOpenId === boss.id && (
                                <div
                                  ref={bossMenuRef}
                                  className="absolute right-0 top-9 z-50 min-w-[170px] rounded-xl border border-white/10 bg-[#0B0F19] p-1.5 shadow-2xl backdrop-blur-md"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBossMenuOpenId(null);
                                      router.push(`/protected/focus?questId=${boss.id}`);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 transition-colors text-left cursor-pointer"
                                  >
                                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                                    <span>Focus Chamber</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      toggleImportantQuest(boss.id);
                                      setBossMenuOpenId(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors text-left cursor-pointer"
                                  >
                                    <Star className="h-3.5 w-3.5 text-amber-400" />
                                    <span>{isImportant ? "Unpin Quest" : "Pin as Important"}</span>
                                  </button>

                                  {onDelete && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBossMenuOpenId(null);
                                        setDeleteConfirmBossId(boss.id);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer border-t border-white/5 mt-1 pt-2"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Abandon Boss Quest</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="font-rpg text-xl sm:text-2xl font-bold tracking-wide text-white mt-3">
                            {boss.title}
                          </h3>

                          {/* Description */}
                          {boss.description && (
                            <p className="text-xs sm:text-sm text-[var(--xp-text-muted)] mt-1.5">
                              {boss.description}
                            </p>
                          )}

                          {/* Rewards Row */}
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold tabular-nums">
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              <span>+{boss.xpReward} XP</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-[var(--xp-gold)]">
                              <span className="text-sm">🪙</span>
                              <span>+{boss.goldReward} Gold</span>
                            </span>

                            {(boss.bonusXpReward ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-orange-400 text-xs font-extrabold uppercase">
                                <span>+{boss.bonusXpReward} Boss XP</span>
                              </span>
                            )}

                            {(boss.bonusGoldReward ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 text-xs font-extrabold uppercase">
                                <span>+{boss.bonusGoldReward} Boss Gold</span>
                              </span>
                            )}
                          </div>

                          {/* Progress Bar & Integrity % */}
                          <div className="mt-4 flex flex-col gap-1.5 w-full">
                            <div className="flex items-center justify-between text-xs font-bold text-white/80">
                              <span className="font-serif italic text-[11px] text-[var(--xp-text-muted)]">
                                Quest Integrity
                              </span>
                              <span className="font-mono">{currentProgress}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  hasPenalty
                                    ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"
                                    : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400"
                                }`}
                                style={{ width: `${currentProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-5">
                          {isExpired ? (
                            <button
                              type="button"
                              disabled
                              className="w-full border border-red-500/30 bg-red-950/40 text-red-300/80 rounded-xl py-2.5 px-6 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                            >
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <span>Boss Escaped (Deadline Missed)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuestComplete(boss)}
                              disabled={isPending}
                              className="w-full border border-amber-500/40 bg-black/50 hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 rounded-xl py-2.5 px-6 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                              ) : (
                                <>
                                  <span>Enter Quest</span>
                                  <span>→</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirmation Modal for Boss */}
                    {deleteConfirmBossId === boss.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-[#0E131F] p-5 shadow-2xl">
                          <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h4 className="font-rpg text-sm font-bold text-red-400 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Abandon Boss Quest?</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmBossId(null)}
                              className="text-white/40 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-[var(--xp-text-muted)] mt-3">
                            Are you sure you want to abandon &ldquo;{boss.title}&rdquo;? The Boss event will be removed from your chronicle.
                          </p>
                          <div className="mt-5 flex gap-2.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmBossId(null)}
                              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBoss(boss.id)}
                              disabled={isDeletingBoss}
                              className="rounded-xl border border-red-500/50 bg-red-600/30 px-3.5 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-600/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isDeletingBoss ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span>Abandon</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 2. SECTION DIVIDER: YOUR QUEST BOARD */}
      {showColumns && (
        <div className="flex items-center justify-center gap-4 my-2 sm:my-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-amber-500/40" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
            <span className="text-[10px]">✧</span>
            <span>YOUR QUEST BOARD</span>
            <span className="text-[10px]">✧</span>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-amber-500/20 to-amber-500/40" />
        </div>
      )}

      {/* 3. THREE COLUMNS GRID: Styled as the Tactical Guild Quest Bulletin Board */}
      {showColumns && (
        <div className="relative rounded-3xl border border-amber-500/25 p-3.5 sm:p-5 shadow-2xl overflow-hidden group">
          {/* Authentic Dark Oak Wood Planks Notice Board Backing */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/dark_wood_planks.jpg"
              alt="Guild Notice Board"
              className="h-full w-full object-cover object-center opacity-65 filter brightness-95 contrast-120 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080C14]/70 via-[#0A0E1C]/55 to-[#080C14]/85" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#080C14_85%)]" />
          </div>

          <section
            role="region"
            aria-label="Active Quests"
            className={`relative z-10 items-start ${
              activeFilter === "daily" || activeFilter === "weekly" || activeFilter === "custom"
                ? "grid grid-cols-1 max-w-2xl mx-auto w-full gap-5"
                : "flex overflow-x-auto pb-4 gap-4 sm:gap-5 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 snap-x snap-mandatory board-scrollbar"
            }`}
          >
            {/* Column 1: TODAY */}
            {(activeFilter === "all" || activeFilter === "daily" || activeFilter === "important") && (
              <div className="relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0A0F1D]/80 p-3.5 sm:p-4 backdrop-blur-md shadow-lg group min-w-[285px] sm:min-w-[320px] md:min-w-0 flex-1 shrink-0 md:shrink snap-center">
                {/* Column Atmospheric Artwork Layer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/quest_realm_bg.jpg"
                    alt=""
                    className="h-full w-full object-cover object-[15%_center] filter brightness-100 contrast-125 scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/40 via-[#0A0F1D]/60 to-[#0A0F1D]/90" />
                </div>

              <CornerFiligree className="absolute top-1.5 right-1.5 text-white/10 -scale-x-100" />
              <div className="relative z-10 flex items-center justify-between pb-1 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>TODAY ({todayQuests.length})</span>
                </div>
              </div>

              <div className="relative z-10 flex flex-col gap-2.5 min-h-[140px] transition-all">
                {todayQuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-white/10 bg-black/30">
                    <Sun className="h-6 w-6 text-white/20 mb-2" />
                    <p className="text-xs font-medium text-[var(--xp-text-faint)]">
                      No daily quests active
                    </p>
                    {onOpenNewQuestModal && (
                      <button
                        type="button"
                        onClick={onOpenNewQuestModal}
                        className="mt-3 text-[11px] font-bold text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        + Inscribe Daily Quest
                      </button>
                    )}
                  </div>
                ) : (
                  todayQuests.map((quest) => (
                    <QuestBoardCard
                      key={quest.id}
                      quest={quest}
                      completed={false}
                      pending={pendingQuestId === quest.id}
                      isImportant={importantQuestIds.has(quest.id)}
                      onToggleImportant={toggleImportantQuest}
                      onComplete={handleQuestComplete}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Column 2: THIS WEEK */}
          {(activeFilter === "all" || activeFilter === "weekly" || activeFilter === "important") && (
            <div className="relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0A0F1D]/80 p-3.5 sm:p-4 backdrop-blur-md shadow-lg group min-w-[285px] sm:min-w-[320px] md:min-w-0 flex-1 shrink-0 md:shrink snap-center">
              {/* Column Atmospheric Artwork Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/vintage_blueprint.jpg"
                  alt=""
                  className="h-full w-full object-cover object-[50%_center] filter brightness-95 contrast-125 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/40 via-[#0A0F1D]/60 to-[#0A0F1D]/90" />
              </div>

              <CornerFiligree className="absolute top-1.5 right-1.5 text-white/10 -scale-x-100" />
              <div className="relative z-10 flex items-center justify-between pb-1 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span>THIS WEEK ({thisWeekQuests.length})</span>
                </div>
              </div>

              <div className="relative z-10 flex flex-col gap-2.5 min-h-[140px] transition-all">
                {thisWeekQuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-white/10 bg-black/30">
                    <Calendar className="h-6 w-6 text-white/20 mb-2" />
                    <p className="text-xs font-medium text-[var(--xp-text-faint)]">
                      No weekly quests active
                    </p>
                    {onOpenNewQuestModal && (
                      <button
                        type="button"
                        onClick={onOpenNewQuestModal}
                        className="mt-3 text-[11px] font-bold text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        + Inscribe Weekly Quest
                      </button>
                    )}
                  </div>
                ) : (
                  thisWeekQuests.map((quest) => (
                    <QuestBoardCard
                      key={quest.id}
                      quest={quest}
                      completed={false}
                      pending={pendingQuestId === quest.id}
                      isImportant={importantQuestIds.has(quest.id)}
                      onToggleImportant={toggleImportantQuest}
                      onComplete={handleQuestComplete}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Column 3: ONE-TIME */}
          {(activeFilter === "all" || activeFilter === "custom" || activeFilter === "important") && (
            <div className="relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0A0F1D]/80 p-3.5 sm:p-4 backdrop-blur-md shadow-lg group min-w-[285px] sm:min-w-[320px] md:min-w-0 flex-1 shrink-0 md:shrink snap-center">
              {/* Column Atmospheric Artwork Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/old_book_quill.jpg"
                  alt=""
                  className="h-full w-full object-cover object-[center_35%] filter brightness-95 contrast-125 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/40 via-[#0A0F1D]/60 to-[#0A0F1D]/90" />
              </div>

              <CornerFiligree className="absolute top-1.5 right-1.5 text-white/10 -scale-x-100" />
              <div className="relative z-10 flex items-center justify-between pb-1 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>ONE-TIME ({oneTimeQuests.length})</span>
                </div>
              </div>

              <div className="relative z-10 flex flex-col gap-2.5 min-h-[140px] transition-all">
                {oneTimeQuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-white/10 bg-black/30">
                    <Star className="h-6 w-6 text-white/20 mb-2" />
                    <p className="text-xs font-medium text-[var(--xp-text-faint)]">
                      No one-time quests active
                    </p>
                    {onOpenNewQuestModal && (
                      <button
                        type="button"
                        onClick={onOpenNewQuestModal}
                        className="mt-3 text-[11px] font-bold text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        + Inscribe One-Time Quest
                      </button>
                    )}
                  </div>
                ) : (
                  oneTimeQuests.map((quest) => (
                    <QuestBoardCard
                      key={quest.id}
                      quest={quest}
                      completed={false}
                      pending={pendingQuestId === quest.id}
                      isImportant={importantQuestIds.has(quest.id)}
                      onToggleImportant={toggleImportantQuest}
                      onComplete={handleQuestComplete}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Mobile Horizontal Swipe Hint */}
        {activeFilter === "all" && (
          <div className="relative z-10 mt-2 text-center md:hidden pointer-events-none">
            <p className="text-[10px] text-amber-400/75 font-serif italic flex items-center justify-center gap-2">
              <span>⟵</span>
              <span>Swipe horizontally to view all Quest Columns</span>
              <span>⟶</span>
            </p>
          </div>
        )}
      </div>
      )}

      {/* 4. COMPLETED SECTION */}
      {showCompleted && (
        <section
          role="region"
          aria-label="Completed Quests"
          className="relative rounded-2xl border-2 border-[#8C6D47]/40 bg-[#1D140C]/90 p-4 sm:p-6 pb-8 backdrop-blur-md shadow-[0_16px_36px_rgba(0,0,0,0.6)] flex flex-col gap-4 mt-6 group transition-all"
        >
          {/* Authentic Vintage Paper Board Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/vintage_paper.jpg"
              alt="Vintage Paper Background"
              className="h-full w-full object-cover filter contrast-115 brightness-90 sepia-[0.25] opacity-90 scale-105"
            />
            {/* Aged Paper Vignette & Burnished Edges */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C1208]/40 via-transparent to-[#160D06]/65" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(24,14,7,0.65)_100%)]" />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(30,18,8,0.7)]" />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#8C6D47]/50 bg-[#F4E8D1]/90 shadow-sm backdrop-blur-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#3D2612]">
                  COMPLETED ({completedQuests.length})
                </span>
              </div>

              {/* Move / Drag Indicator */}
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#5C3E1F] bg-[#F4E8D1]/80 px-2.5 py-1 rounded-md border border-[#8C6D47]/30 shadow-xs">
                <Move className="h-3 w-3 text-amber-800" />
                <span>Drag & drop notes freely</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset Layout button if any custom order or custom positions exist */}
              {(Object.keys(stickyPositions).length > 0 || stickyOrder.length > 0) && (
                <button
                  type="button"
                  onClick={handleResetStickyLayout}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C3E1F] hover:text-[#2A1B0D] bg-[#F4E8D1]/90 hover:bg-[#F4E8D1] px-2.5 py-1 rounded-md border border-[#8C6D47]/40 shadow-xs transition-all cursor-pointer"
                  title="Snap all sticky notes back to the grid"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Grid</span>
                </button>
              )}

              <span className="text-[11px] font-serif italic text-[#4A321E] bg-[#F4E8D1]/70 px-2.5 py-1 rounded-md border border-[#8C6D47]/30">
                Pinned Records
              </span>
            </div>
          </div>

          {completedQuests.length === 0 ? (
            <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[#8C6D47]/50 bg-[#FAF3E0]/40 backdrop-blur-xs">
              <CheckCircle2 className="h-7 w-7 text-[#8C6D47]/60 mb-2" />
              <p className="text-xs font-semibold text-[#3D2612]">
                No quests completed yet
              </p>
              <p className="text-[11px] text-[#5C4533] mt-0.5">
                Complete your quests above to pin your triumphant sticky notes here.
              </p>
            </div>
          ) : (
            <div
              onPointerMove={handleStickyPointerMove}
              onPointerUp={handleStickyPointerUp}
              className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pt-3 pb-8 min-h-fit transition-all"
            >
              {sortedCompletedQuests.map((quest, index) => (
                <QuestBoardCard
                  key={quest.id}
                  quest={quest}
                  completed={true}
                  rotationIndex={index}
                  pending={pendingQuestId === quest.id}
                  isImportant={importantQuestIds.has(quest.id)}
                  onToggleImportant={toggleImportantQuest}
                  onComplete={handleQuestComplete}
                  onDelete={onDelete}
                  isDragging={draggingStickyId === quest.id}
                  dragOffset={
                    draggingStickyId === quest.id
                      ? dragCurrentOffset
                      : stickyPositions[quest.id]
                  }
                  isDropTarget={dropTargetStickyId === quest.id}
                  onPointerDownDrag={handleStickyPointerDown}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default QuestBoardView;
