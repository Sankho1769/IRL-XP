// components/dashboard/QuestBoardCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Droplets,
  BookOpen,
  Brain,
  Calendar,
  Target,
  Dumbbell,
  Flower2,
  Sparkles,
  MoreHorizontal,
  Check,
  Loader2,
  AlertTriangle,
  Star,
  Timer,
  Trash2,
} from "lucide-react";
import type { Quest } from "@/types/dashboard";
import type { CompleteQuestResult } from "@/app/actions/quests";
import { getMissedDeadlineInfo } from "@/lib/dashboard/character-adapter";

interface QuestBoardCardProps {
  quest: Quest;
  completed?: boolean;
  pending?: boolean;
  isImportant?: boolean;
  onToggleImportant?: (questId: string) => void;
  onComplete?: (quest: Quest) => Promise<CompleteQuestResult | boolean | void | null> | CompleteQuestResult | boolean | void | null;
  onDelete?: (questId: string) => Promise<boolean | void> | boolean | void;
  rotationIndex?: number;
  isDragging?: boolean;
  dragOffset?: { x: number; y: number };
  isDropTarget?: boolean;
  onPointerDownDrag?: (e: React.PointerEvent, questId: string) => void;
}

function getQuestIcon(quest: Quest, isCompleted: boolean) {
  const title = (quest.title || "").toLowerCase();
  const desc = (quest.description || "").toLowerCase();
  const cat = quest.category;

  if (isCompleted) {
    let icon = Dumbbell;
    if (title.includes("workout") || title.includes("exercise") || cat === "strength") {
      icon = Dumbbell;
    } else if (title.includes("plan") || title.includes("tomorrow") || title.includes("calendar")) {
      icon = Calendar;
    } else if (title.includes("dsa") || title.includes("study") || cat === "intelligence") {
      icon = Brain;
    } else if (title.includes("water") || title.includes("drink")) {
      icon = Droplets;
    } else if (title.includes("book") || title.includes("read")) {
      icon = BookOpen;
    } else if (cat === "health") {
      icon = Flower2;
    } else {
      icon = Target;
    }
    return {
      icon,
      bg: "bg-[#EAE0C8]/90",
      border: "border-[#C5AF89]",
      color: "text-[#5C3E1F]",
    };
  }

  if (title.includes("water") || title.includes("drink") || desc.includes("water") || desc.includes("litres")) {
    return {
      icon: Droplets,
      bg: "bg-cyan-500/15",
      border: "border-cyan-500/30",
      color: "text-cyan-400",
    };
  }
  if (title.includes("book") || title.includes("read") || desc.includes("read") || desc.includes("pages")) {
    return {
      icon: BookOpen,
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      color: "text-emerald-400",
    };
  }
  if (title.includes("meditat") || title.includes("mind") || desc.includes("meditat")) {
    return {
      icon: Flower2,
      bg: "bg-green-500/15",
      border: "border-green-500/30",
      color: "text-green-400",
    };
  }
  if (title.includes("dsa") || title.includes("code") || title.includes("study") || cat === "intelligence") {
    return {
      icon: Brain,
      bg: "bg-purple-500/15",
      border: "border-purple-500/30",
      color: "text-purple-400",
    };
  }
  if (title.includes("plan") || title.includes("tomorrow") || title.includes("calendar")) {
    return {
      icon: Calendar,
      bg: "bg-indigo-500/15",
      border: "border-indigo-500/30",
      color: "text-indigo-400",
    };
  }
  if (title.includes("skill") || title.includes("learn") || cat === "discipline") {
    return {
      icon: Target,
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      color: "text-amber-400",
    };
  }
  if (title.includes("workout") || title.includes("exercise") || title.includes("gym") || cat === "strength") {
    return {
      icon: Dumbbell,
      bg: "bg-rose-500/15",
      border: "border-rose-500/30",
      color: "text-rose-400",
    };
  }
  return {
    icon: Sparkles,
    bg: "bg-[var(--xp-gold)]/15",
    border: "border-[var(--xp-gold)]/30",
    color: "text-[var(--xp-gold)]",
  };
}

export function QuestBoardCard({
  quest,
  completed: controlledCompleted,
  pending,
  isImportant = false,
  onToggleImportant,
  onComplete,
  onDelete,
  rotationIndex,
  isDragging = false,
  dragOffset,
  isDropTarget = false,
  onPointerDownDrag,
}: QuestBoardCardProps) {
  const isControlled = controlledCompleted !== undefined;
  const [internalCompleted, setInternalCompleted] = useState(quest.completed);
  const completed = isControlled ? controlledCompleted : internalCompleted;

  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta = getQuestIcon(quest, completed);
  const Icon = meta.icon;

  const missedInfo = !completed && quest.deadlineAt ? getMissedDeadlineInfo(quest) : null;
  const hasPenalty = Boolean(quest.penalty || missedInfo?.isMissed);
  const penaltyAmount = quest.penalty?.penaltyAmount ?? missedInfo?.penaltyAmount ?? 15;

  const isCardDragging = isDragging && Boolean(dragOffset);
  const dragStyle: React.CSSProperties = isCardDragging
    ? {
        transform: `translate3d(${dragOffset?.x ?? 0}px, ${dragOffset?.y ?? 0}px, 0) scale(1.05) rotate(-2deg)`,
        zIndex: 50,
        boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 25px rgba(229,184,105,0.4)",
        cursor: "grabbing",
        touchAction: "none",
      }
    : completed && dragOffset && (dragOffset.x !== 0 || dragOffset.y !== 0)
    ? {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
        touchAction: "none",
      }
    : {
        touchAction: completed ? "none" : "auto",
      };

  const STICKY_ROTATION_CLASSES = [
    "-rotate-[1deg] sm:-rotate-[1deg] hover:rotate-0",
    "rotate-[1deg] sm:rotate-[1deg] hover:rotate-0",
    "-rotate-[1.5deg] sm:-rotate-[1.5deg] hover:rotate-0",
    "rotate-[1.2deg] sm:rotate-[1.2deg] hover:rotate-0",
    "-rotate-[0.7deg] sm:-rotate-[0.7deg] hover:rotate-0",
    "rotate-[0.8deg] sm:rotate-[0.8deg] hover:rotate-0",
  ];
  const rotationClass =
    rotationIndex !== undefined
      ? STICKY_ROTATION_CLASSES[Math.abs(rotationIndex) % STICKY_ROTATION_CLASSES.length]
      : STICKY_ROTATION_CLASSES[Math.abs(quest.title.length) % STICKY_ROTATION_CLASSES.length];

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (submitting || pending || completed) return;
    setSubmitting(true);
    try {
      if (onComplete) {
        const success = await onComplete(quest);
        if (success && !isControlled) {
          setInternalCompleted(true);
        }
      } else if (!isControlled) {
        setInternalCompleted((prev) => !prev);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    if (!onDelete) return;
    const confirmDelete = window.confirm(`Abandon quest "${quest.title}"?`);
    if (confirmDelete) {
      await onDelete(quest.id);
    }
  }

  return (
    <div
      data-sticky-id={quest.id}
      style={dragStyle}
      onPointerDown={
        completed && onPointerDownDrag
          ? (e) => onPointerDownDrag(e, quest.id)
          : undefined
      }
      className={`group relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 transition-all ${
        isCardDragging ? "duration-0" : "duration-300"
      } ${
        completed
          ? `border ${
              isDropTarget
                ? "border-amber-500 ring-2 ring-amber-500/80 bg-[#FFF7DB] scale-[0.98]"
                : isCardDragging
                ? "border-amber-500 ring-2 ring-amber-400"
                : "border-[#D4C3A3] hover:border-amber-600/60"
            } bg-[#FBF6EA] text-[#2A1B0D] shadow-[0_8px_20px_-3px_rgba(0,0,0,0.45),0_2px_6px_rgba(0,0,0,0.2)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.55)] ${
              isCardDragging ? "" : "hover:scale-[1.02]"
            } z-10 ${isCardDragging ? "" : rotationClass} cursor-grab active:cursor-grabbing select-none`
          : hasPenalty
          ? "border-red-600/30 bg-[#120B16]/90 shadow-[0_0_12px_rgba(220,38,38,0.12)]"
          : "border-white/[0.07] bg-[#0E1424]/90 hover:bg-[#121A30] hover:border-white/15 shadow-md"
      }`}
    >
      {/* Sticky Note Pin & Texture when Completed */}
      {completed && (
        <>
          {/* Authentic Crinkled Vintage Paper Texture Blend Layer */}
          <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden mix-blend-multiply opacity-55">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/vintage_paper.jpg"
              alt=""
              className="h-full w-full object-cover filter contrast-125 brightness-95"
            />
            {/* Aged Paper Perimeter Vignette */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF7]/30 via-transparent to-[#D8C49D]/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(160,120,60,0.25)_100%)]" />
          </div>

          {/* Golden Brass Pushpin / Thumbtack Pinned at Top Center */}
          <div
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-grab active:cursor-grabbing p-1"
            title="Hold and drag to move sticky note"
          >
            <div
              className={`h-4 w-4 rounded-full bg-gradient-to-br from-[#FFE899] via-[#D97706] to-[#78350F] shadow-[0_3px_6px_rgba(0,0,0,0.45)] border border-[#FEF3C7] flex items-center justify-center ring-1 ring-black/25 ${
                isCardDragging ? "scale-125 ring-amber-400 shadow-lg" : "hover:scale-110"
              } transition-transform`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white/95 shadow-xs" />
            </div>
            <div className="w-2 h-1 bg-black/35 rounded-full blur-[1px] -mt-0.5" />
          </div>

          {/* Curled Bottom-Right Corner Shadow */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-tl from-black/20 via-transparent to-transparent pointer-events-none rounded-br-xl" />
        </>
      )}
      {/* Top Section: Icon, Title, Description, Star + Options */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Category Icon Squircle */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.bg} ${meta.border} ${meta.color} transition-transform group-hover:scale-105`}
          >
            <Icon className="h-4 w-4" />
          </div>

          {/* Title & Description */}
          <div className="min-w-0 flex-1">
            <h4
              className={`font-bold text-xs sm:text-sm leading-snug truncate ${
                completed ? "text-[#2B1B0D] line-through decoration-[#8C5810]/50" : "text-white"
              }`}
              title={quest.title}
            >
              {quest.title}
            </h4>
            {quest.description && (
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  completed ? "text-[#5C4533] italic" : "text-[var(--xp-text-muted)]"
                }`}
                title={quest.description}
              >
                {quest.description}
              </p>
            )}
          </div>
        </div>

        {/* Top Right: Star Button & Options Dropdown Menu */}
        <div className="relative flex items-center gap-1 shrink-0" ref={menuRef}>
          {onToggleImportant && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleImportant(quest.id);
              }}
              aria-label={isImportant ? `Unpin ${quest.title}` : `Pin ${quest.title} as important`}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isImportant
                  ? completed
                    ? "text-amber-600 hover:text-amber-700"
                    : "text-amber-400 hover:text-amber-300"
                  : completed
                  ? "text-[#8C6D47]/60 hover:text-[#3D2612] hover:bg-[#0000000d]"
                  : "text-white/20 hover:text-white/60"
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isImportant
                    ? completed
                      ? "fill-amber-600 text-amber-600"
                      : "fill-amber-400 text-amber-400"
                    : ""
                }`}
              />
            </button>
          )}

          {/* Options Menu Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              completed
                ? "text-[#8C6D47]/80 hover:text-[#3D2612] hover:bg-[#0000000d]"
                : "text-white/30 hover:text-white hover:bg-white/5"
            }`}
            aria-label={`Options for ${quest.title}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* Options Dropdown Menu */}
          {menuOpen && (
            <div
              role="menu"
              className={`absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl border p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
                completed
                  ? "border-[#C5AF89] bg-[#FAF3E0] text-[#2B1B0D] shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
                  : "border-white/10 bg-[#0D1220]/95 backdrop-blur-xl text-[var(--xp-text)]"
              }`}
            >
              <Link
                href={`/protected/focus?questId=${quest.id}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  completed ? "text-[#2B1B0D] hover:bg-[#EAE0C8]" : "text-[var(--xp-text)] hover:bg-white/5"
                }`}
              >
                <Timer className={`h-3.5 w-3.5 ${completed ? "text-amber-700" : "text-amber-400"}`} />
                <span>Focus Chamber</span>
              </Link>

              {onToggleImportant && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleImportant(quest.id);
                    setMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                    completed ? "text-[#2B1B0D] hover:bg-[#EAE0C8]" : "text-[var(--xp-text)] hover:bg-white/5"
                  }`}
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      isImportant
                        ? completed
                          ? "text-amber-600 fill-amber-600"
                          : "text-amber-400 fill-amber-400"
                        : completed
                        ? "text-[#8C6D47]"
                        : "text-white/40"
                    }`}
                  />
                  <span>{isImportant ? "Unpin Quest" : "Pin Important"}</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDeleteClick}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                    completed ? "text-red-700 hover:bg-red-100" : "text-red-400 hover:bg-red-950/40"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Abandon Quest</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Missed Deadline Warning Pill */}
      {hasPenalty && !completed && (
        <div className="mt-2.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-red-500/40 bg-red-950/40 text-red-300">
          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
          <span>MISSED DEADLINE • -{penaltyAmount} PROGRESS</span>
        </div>
      )}

      {/* Bottom Section: Rewards & Checkbox */}
      <div
        className={`mt-3.5 flex items-center justify-between gap-2 pt-2 border-t ${
          completed ? "border-[#DCCBB0]/80" : "border-white/[0.04]"
        }`}
      >
        {/* Rewards */}
        <div className="flex items-center gap-3 text-[11px] font-semibold tabular-nums">
          <span className={`flex items-center gap-1 ${completed ? "text-[#854D0E] font-bold" : "text-amber-300"}`}>
            <span className={completed ? "text-[#B45309] text-xs" : "text-amber-400 text-xs"}>★</span>
            <span>+{quest.xpReward} XP</span>
          </span>
          <span className={`flex items-center gap-1 ${completed ? "text-[#78350F] font-bold" : "text-[var(--xp-gold)]"}`}>
            <span className="text-xs">🪙</span>
            <span>+{quest.goldReward} Gold</span>
          </span>
        </div>

        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={submitting || pending || completed}
          aria-label={completed ? "Quest completed" : `Complete ${quest.title}`}
          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all ${
            completed
              ? "border-emerald-700/60 bg-emerald-600/20 text-emerald-800 shadow-sm ring-1 ring-emerald-700/30 cursor-pointer"
              : "border-white/25 bg-black/40 hover:border-amber-400 hover:bg-amber-400/10 cursor-pointer shadow-sm"
          }`}
        >
          {pending || submitting ? (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--xp-gold)]" />
          ) : completed ? (
            <Check className="h-3.5 w-3.5 stroke-[3.5] text-emerald-800" />
          ) : null}
        </button>
      </div>
    </div>
  );
}

export default QuestBoardCard;
