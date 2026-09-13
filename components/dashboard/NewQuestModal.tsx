// components/dashboard/NewQuestModal.tsx
"use client";

import React, { useState, useEffect, useId } from "react";
import {
  X,
  Sparkles,
  Coins,
  Dumbbell,
  Brain,
  Target,
  HeartPulse,
  Palette,
  Scroll,
  Swords,
  Calendar,
  Clock,
  Flame,
  Loader2,
  Hammer,
} from "lucide-react";
import type { QuestCategory, QuestFrequency } from "@/types/dashboard";
import { createQuest, type Quest as DbQuest } from "@/app/actions/quests";
import { QuillScribeAnimation, useQuillTyping } from "./QuillScribeAnimation";

interface NewQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestCreated: (newQuest: DbQuest) => void;
}

const CATEGORIES: {
  key: QuestCategory;
  label: string;
  icon: typeof Dumbbell;
  color: string;
  bg: string;
}[] = [
  { key: "strength", label: "Strength", icon: Dumbbell, color: "#F97316", bg: "rgba(249, 115, 22, 0.15)" },
  { key: "intelligence", label: "Intelligence", icon: Brain, color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)" },
  { key: "discipline", label: "Discipline", icon: Target, color: "#E5B869", bg: "rgba(229, 184, 105, 0.15)" },
  { key: "health", label: "Health", icon: HeartPulse, color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
  { key: "creativity", label: "Creativity", icon: Palette, color: "#A78BFA", bg: "rgba(167, 139, 250, 0.15)" },
];

const QUICK_FREQUENCIES: { key: "daily" | "weekly" | "once" | "custom"; label: string; desc: string }[] = [
  { key: "daily", label: "Daily", desc: "Resets every 24h" },
  { key: "weekly", label: "Weekly", desc: "Resets on Mondays" },
  { key: "once", label: "Once", desc: "One-time task" },
  { key: "custom", label: "Custom Date", desc: "Specific deadline" },
];

const DIFFICULTIES = [
  { label: "Easy", xp: 20, gold: 10 },
  { label: "Medium", xp: 50, gold: 25 },
  { label: "Hard", xp: 100, gold: 50 },
];

function getDefaultTomorrowDate(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);
}

function CraftingCornerBracket({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 18V5a3 3 0 0 1 3-3h13" />
      <path d="M2 5l6 6" />
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="15" cy="5" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="5" cy="15" r="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function NewQuestModal({ isOpen, onClose, onQuestCreated }: NewQuestModalProps) {
  const [modalTab, setModalTab] = useState<"quick" | "boss">("quick");

  // Shared form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<QuestCategory>("discipline");
  const [scheduleType, setScheduleType] = useState<"daily" | "weekly" | "once" | "custom">("daily");

  // Custom date / Boss deadline state (Asia/Kolkata)
  const [customDate, setCustomDate] = useState(() => getDefaultTomorrowDate());
  const [customTime, setCustomTime] = useState("23:59");

  // Rewards
  const [difficulty, setDifficulty] = useState("Medium");
  const [xpReward, setXpReward] = useState(50);
  const [goldReward, setGoldReward] = useState(25);

  // Boss bonus rewards
  const [bonusXp, setBonusXp] = useState(200);
  const [bonusGold, setBonusGold] = useState(100);

  // Hidden details toggle for Quick Quest
  const [showDetails, setShowDetails] = useState(false);

  // Quill typing tracking for title & description
  const { isTyping: isTitleTyping, registerTyping: registerTitleTyping } = useQuillTyping(900);
  const { isTyping: isDescTyping, registerTyping: registerDescTyping } = useQuillTyping(900);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCustomDate(getDefaultTomorrowDate());
      setCustomTime("23:59");
      setShowDetails(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function selectDifficulty(diff: typeof DIFFICULTIES[0]) {
    setDifficulty(diff.label);
    setXpReward(diff.xp);
    setGoldReward(diff.gold);
  }

  function computeDeadlineIso(): string | null {
    if (modalTab === "boss" || scheduleType === "custom") {
      if (!customDate || !customTime) return null;
      // Construct ISO timestamp explicitly anchored in Asia/Kolkata (+05:30)
      const kolkataIso = `${customDate}T${customTime}:00+05:30`;
      const dateObj = new Date(kolkataIso);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toISOString();
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a quest title.");
      return;
    }

    setError(null);

    const deadlineIso = computeDeadlineIso();

    if (modalTab === "boss" || scheduleType === "custom") {
      if (!deadlineIso) {
        setError("Choose a future date and time.");
        return;
      }
      if (new Date(deadlineIso).getTime() <= Date.now()) {
        setError("Choose a future date and time.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const isBoss = modalTab === "boss";
      const questFrequency: QuestFrequency = isBoss || scheduleType === "custom" ? "once" : (scheduleType as QuestFrequency);

      const result = await createQuest({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        frequency: questFrequency,
        xp_reward: xpReward,
        gold_reward: goldReward,
        quest_type: isBoss ? "boss" : "habit",
        deadline_at: deadlineIso,
        bonus_xp_reward: isBoss ? bonusXp : 0,
        bonus_gold_reward: isBoss ? bonusGold : 0,
      });

      if (result.error || !result.data) {
        if (result.error === "MIGRATION_REQUIRED") {
          setError("Database schema update required. Please ensure migration 006 has been applied.");
        } else if (result.error === "INVALID_DEADLINE") {
          setError("Choose a future date and time.");
        } else if (result.error === "INVALID_INPUT") {
          setError("Please check the quest details and try again.");
        } else if (result.error === "UNAUTHENTICATED") {
          setError("Your session has expired. Please sign in again.");
        } else {
          setError("Unable to inscribe quest. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      onQuestCreated(result.data);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("discipline");
      setScheduleType("daily");
      setXpReward(50);
      setGoldReward(25);
      setBonusXp(200);
      setBonusGold(100);
      setModalTab("quick");
      setShowDetails(false);
      onClose();
    } catch {
      setError("An unexpected error occurred while forging the quest.");
    } finally {
      setSubmitting(false);
    }
  }

  const isBossMode = modalTab === "boss";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-quest-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
      onClick={onClose}
    >
      {/* Full-Screen Workshop Backdrop Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/crafting_table_bg.jpg"
          alt="Crafting Table Workshop"
          className="h-full w-full object-cover object-center opacity-80 filter brightness-95 contrast-115 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080C14]/50 via-[#080C14]/30 to-[#080C14]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#080C14_85%)]" />
        {/* Forge Fire / Candle Warmth Glows */}
        <div className="absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-amber-500/25 blur-[100px]" />
        <div className="absolute -bottom-20 right-1/4 h-80 w-80 rounded-full bg-orange-600/25 blur-[100px]" />
      </div>

      {/* Modal Dialog: Styled as the RPG Quest Crafting Table Workbench */}
      <div
        className={`relative z-10 w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border-2 animate-in zoom-in-95 duration-200 shadow-[0_25px_70px_rgba(0,0,0,0.9)] transition-all ${
          isBossMode
            ? "border-red-500/60 bg-[#160B12]/95 shadow-red-950/60"
            : "border-amber-500/50 bg-[#101522]/95 shadow-amber-950/50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Crafting Table Workbench Surface Layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Wood Planks / Desk Texture */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/dark_wood_planks.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-25 filter brightness-90 contrast-125 scale-105"
          />
          {/* Dark Workbench Shading & Vignette */}
          <div
            className={`absolute inset-0 ${
              isBossMode
                ? "bg-gradient-to-b from-[#1C0D17]/85 via-[#120B15]/80 to-[#0A050D]/90"
                : "bg-gradient-to-b from-[#101522]/85 via-[#0B0F19]/80 to-[#080C14]/90"
            }`}
          />
          {/* Radial Table Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,195,98,0.18)_0%,transparent_70%)]" />

          {/* Inlaid 3x3 Crafting Grid Blueprint Watermark */}
          <div className="absolute right-6 bottom-6 opacity-[0.06] pointer-events-none hidden sm:block">
            <svg
              width="180"
              height="180"
              viewBox="0 0 180 180"
              fill="none"
              stroke="currentColor"
              className="text-amber-300"
            >
              <rect x="10" y="10" width="160" height="160" rx="8" strokeWidth="2" strokeDasharray="4 3" />
              <line x1="63" y1="10" x2="63" y2="170" strokeWidth="1.5" />
              <line x1="117" y1="10" x2="117" y2="170" strokeWidth="1.5" />
              <line x1="10" y1="63" x2="170" y2="63" strokeWidth="1.5" />
              <line x1="10" y1="117" x2="170" y2="117" strokeWidth="1.5" />
              <circle cx="90" cy="90" r="14" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M90 80v20M80 90h20" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Heavy Iron/Brass Corner Brackets with Rivets */}
        <CraftingCornerBracket className="absolute top-2 left-2 text-amber-500/40 pointer-events-none z-20 hidden sm:block" />
        <CraftingCornerBracket className="absolute top-2 right-2 text-amber-500/40 -scale-x-100 pointer-events-none z-20 hidden sm:block" />
        <CraftingCornerBracket className="absolute bottom-2 left-2 text-amber-500/40 -scale-y-100 pointer-events-none z-20 hidden sm:block" />
        <CraftingCornerBracket className="absolute bottom-2 right-2 text-amber-500/40 -scale-x-100 -scale-y-100 pointer-events-none z-20 hidden sm:block" />

        {/* 1. Header with Tab Switcher & Close Button */}
        <div className="relative z-10 shrink-0 px-4 sm:px-6 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3 border-b border-white/[0.08]">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab Pill Buttons */}
              <div className="inline-flex rounded-xl border border-white/10 bg-[#080C14] p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={() => setModalTab("quick")}
                  className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 sm:px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                    !isBossMode
                      ? "bg-[var(--xp-gold)] text-[#080C14] shadow-sm"
                      : "text-[var(--xp-text-muted)] hover:text-white"
                  }`}
                >
                  <span>⚡ Quick Quest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab("boss")}
                  className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 sm:px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                    isBossMode
                      ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-600/30"
                      : "text-[var(--xp-text-muted)] hover:text-red-400"
                  }`}
                >
                  <Swords className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Boss Event</span>
                </button>
              </div>

              {/* Badge: QUEST CRAFTING TABLE / BOSS FORGE */}
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                  isBossMode
                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              >
                <Hammer className="h-3 w-3" />
                <span>{isBossMode ? "BOSS FORGE" : "CRAFTING TABLE"}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--xp-text-muted)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2">
            <h2 id="new-quest-title" className="font-rpg text-base sm:text-lg font-bold text-[var(--xp-text)] truncate">
              {isBossMode ? "Summon a Boss Event" : "Create a New Quest"}
            </h2>
            <p className="text-[11px] sm:text-xs text-[var(--xp-text-muted)] font-serif italic mt-0.5">
              {isBossMode
                ? "Confront high-stakes trials with strict deadlines and legendary spoils."
                : "Turn intention into progress. Simple, fast quest creation in under 10 seconds."}
            </p>
          </div>
        </div>

        {/* 2. Scrollable Form Body with Sticky Footer */}
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-3.5 [scrollbar-width:thin] [scrollbar-color:rgba(229,184,105,0.3)_transparent]">
            {/* Visual Showcase Banner */}
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30 shadow-md group shrink-0">
              <div className="h-18 sm:h-24 w-full relative overflow-hidden bg-black/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isBossMode ? "/assets/boss_dragon.jpg" : "/assets/crafting_table_bg.jpg"}
                  alt={isBossMode ? "Boss Dragon Encounter" : "Crafting Table Workshop"}
                  className="h-full w-full object-cover filter brightness-105 contrast-115 transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: isBossMode ? "center 22%" : "center 35%" }}
                />
                <div
                  className={`absolute inset-0 ${
                    isBossMode
                      ? "bg-gradient-to-t from-[#160B12] via-[#160B12]/40 to-transparent"
                      : "bg-gradient-to-t from-[#101522] via-[#101522]/40 to-transparent"
                  }`}
                />
                <div
                  className={`absolute inset-0 ${
                    isBossMode
                      ? "bg-gradient-to-r from-[#160B12]/80 via-transparent to-[#160B12]/80"
                      : "bg-gradient-to-r from-[#101522]/80 via-transparent to-[#101522]/80"
                  }`}
                />
                <div className="absolute bottom-1.5 sm:bottom-2 left-2.5 sm:left-4 right-2.5 sm:right-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span
                      className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border shrink-0 ${
                        isBossMode
                          ? "bg-red-500/20 border-red-500/40 text-red-300"
                          : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      }`}
                    >
                      {isBossMode ? <Swords className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Hammer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    </span>
                    <span className="font-rpg text-[11px] sm:text-xs md:text-sm font-bold tracking-wider text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {isBossMode ? "ANVIL OF TRIAL: FORGE BOSS EVENT" : "CRAFTING BENCH: INSCRIBE NEW QUEST"}
                    </span>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] text-amber-300 font-serif italic drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] shrink-0">
                    {isBossMode ? "High-stakes deadline trial" : "Discipline forged into progress"}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-[var(--xp-ember)]/40 bg-[var(--xp-ember)]/10 px-4 py-2 text-xs text-[var(--xp-ember)] font-medium">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--xp-text)]">
                  {isBossMode ? "Boss / Challenge Name" : "Quest Title"}{" "}
                  <span className={isBossMode ? "text-red-400" : "text-[var(--xp-gold)]"}>*</span>
                </label>
                <QuillScribeAnimation
                  isTyping={isTitleTyping}
                  size="xs"
                  showLabel={true}
                  label={isBossMode ? "Inscribing trial decree..." : "Scribing quest..."}
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={200}
                  placeholder={
                    isBossMode
                      ? "e.g. Conquer Calculus Final Exam"
                      : "e.g. Morning 30-min Deep Workout"
                  }
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    registerTitleTyping();
                  }}
                  onKeyDown={registerTitleTyping}
                  className={`w-full rounded-xl border bg-[#0D1322] px-3.5 py-2 pr-11 text-sm text-white placeholder-slate-400 focus:outline-none transition-all ${
                    isTitleTyping
                      ? "border-amber-400/80 shadow-[0_0_15px_rgba(245,195,98,0.25)]"
                      : "border-white/10 focus:border-[var(--xp-gold)]"
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <QuillScribeAnimation
                    isTyping={isTitleTyping}
                    size="sm"
                    showInkDrops={true}
                  />
                </div>
              </div>
            </div>

            {/* Description / Lore */}
            {isBossMode ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--xp-text)]">
                      Boss Lore / Objective <span className="text-[var(--xp-text-faint)] font-normal">(optional)</span>
                    </label>
                    <QuillScribeAnimation
                      isTyping={isDescTyping}
                      size="xs"
                      showLabel={true}
                      label="Drafting lore..."
                    />
                  </div>
                  <span className="text-[10px] text-[var(--xp-text-faint)] tabular-nums">
                    {description.length}/200
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="Describe the win condition needed to slay this boss..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      registerDescTyping();
                    }}
                    onKeyDown={registerDescTyping}
                    className={`w-full rounded-xl border bg-[#0D1322] px-3.5 py-1.5 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none transition-all resize-none ${
                      isDescTyping
                        ? "border-amber-400/80 shadow-[0_0_15px_rgba(245,195,98,0.25)]"
                        : "border-white/10 focus:border-[var(--xp-gold)]"
                    }`}
                  />
                  <div className="absolute right-2.5 top-2.5 pointer-events-none">
                    <QuillScribeAnimation
                      isTyping={isDescTyping}
                      size="sm"
                      showInkDrops={true}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {!showDetails ? (
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="text-xs text-[var(--xp-gold)] hover:underline flex items-center gap-1 font-semibold w-fit py-0.5 cursor-pointer"
                  >
                    <span>+ Add details</span>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-[var(--xp-text)]">
                          Description <span className="text-[var(--xp-text-faint)] font-normal">(optional)</span>
                        </label>
                        <QuillScribeAnimation
                          isTyping={isDescTyping}
                          size="xs"
                          showLabel={true}
                          label="Inscribing details..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetails(false);
                          setDescription("");
                        }}
                        className="text-[10px] text-[var(--xp-text-muted)] hover:text-white cursor-pointer"
                      >
                        Hide details
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        rows={2}
                        maxLength={200}
                        placeholder="Add a short description or victory criteria..."
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          registerDescTyping();
                        }}
                        onKeyDown={registerDescTyping}
                        className={`w-full rounded-xl border bg-[#0D1322] px-3.5 py-1.5 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none transition-all resize-none ${
                          isDescTyping
                            ? "border-amber-400/80 shadow-[0_0_15px_rgba(245,195,98,0.25)]"
                            : "border-white/10 focus:border-[var(--xp-gold)]"
                        }`}
                      />
                      <div className="absolute right-2.5 top-2.5 pointer-events-none">
                        <QuillScribeAnimation
                          isTyping={isDescTyping}
                          size="sm"
                          showInkDrops={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attribute Category */}
            <div>
              <label className="block text-xs font-semibold text-[var(--xp-text)] mb-1.5">
                Attribute Category
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {CATEGORIES.map(({ key, label, icon: Icon, color, bg }) => {
                  const isSelected = category === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-1 sm:p-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--xp-gold)] bg-[var(--xp-gold)]/15 shadow-sm scale-[1.02]"
                          : "border-white/5 bg-[var(--xp-void-raised)] opacity-70 hover:opacity-100 hover:border-white/15"
                      }`}
                    >
                      <div
                        className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg shrink-0"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color }} />
                      </div>
                      <span className="text-[9px] sm:text-[11px] font-semibold text-[var(--xp-text)] truncate w-full">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule / Frequency Selection */}
            {!isBossMode ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--xp-text)] mb-1.5">
                  Schedule
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUICK_FREQUENCIES.map(({ key, label, desc }) => {
                    const isSelected = scheduleType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setScheduleType(key)}
                        className={`flex flex-col items-center rounded-xl border p-1.5 sm:p-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-[var(--xp-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)] font-bold shadow-sm"
                            : "border-white/5 bg-[var(--xp-void-raised)] text-[var(--xp-text-muted)] hover:text-white"
                        }`}
                      >
                        <span className="text-xs font-bold">{label}</span>
                        <span className="text-[9px] opacity-75 font-normal mt-0.5">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Custom Date & Time Picker */}
            {(isBossMode || scheduleType === "custom") && (
              <div
                className={`rounded-xl border p-2.5 sm:p-3 flex flex-col gap-2 transition-all ${
                  isBossMode
                    ? "border-red-500/30 bg-red-950/15"
                    : "border-[var(--xp-border-gold)] bg-[var(--xp-void-raised)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-bold ${
                      isBossMode ? "text-red-400" : "text-[var(--xp-gold)]"
                    }`}
                  >
                    <Clock
                      className={`h-3.5 w-3.5 ${
                        isBossMode ? "text-red-400" : "text-[var(--xp-gold)]"
                      }`}
                    />
                    Deadline
                  </span>
                  <span className="text-[10px] text-[var(--xp-text-muted)] font-medium">
                    IST
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    required
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-[#080C14] px-3 py-1.5 text-xs text-white focus:border-[var(--xp-gold)] focus:outline-none transition-colors"
                  />
                  <input
                    type="time"
                    required
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="sm:w-36 rounded-lg border border-white/10 bg-[#080C14] px-3 py-1.5 text-xs text-white focus:border-[var(--xp-gold)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Reward Tier Presets */}
            <div>
              <label className="block text-xs font-semibold text-[var(--xp-text)] mb-1.5">
                Reward Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((diff) => {
                  const isSelected = difficulty === diff.label;
                  return (
                    <button
                      key={diff.label}
                      type="button"
                      onClick={() => selectDifficulty(diff)}
                      className={`rounded-xl border py-1.5 sm:py-2 text-center transition-all text-xs font-bold cursor-pointer ${
                        isSelected
                          ? "border-[var(--xp-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)]"
                          : "border-white/5 bg-[var(--xp-void-raised)] text-[var(--xp-text-muted)] hover:text-white"
                      }`}
                    >
                      <div>{diff.label}</div>
                      <div className="text-[10px] font-normal opacity-75 mt-0.5">
                        +{diff.xp} XP · +{diff.gold} G
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Boss Bonus Rewards Configuration */}
            {isBossMode && (
              <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/30 to-amber-950/20 p-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                  <Flame className="h-4 w-4 text-red-400" />
                  <span>Boss Bounty Bonuses (Rewarded upon victory)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Bonus XP */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-[#A78BFA] font-semibold">Bonus XP (0–500)</span>
                      <span className="font-bold text-[#A78BFA]">+{bonusXp}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={bonusXp}
                      onChange={(e) => setBonusXp(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                      className="w-full rounded-lg border border-white/10 bg-[#080C14] px-3 py-1.5 text-xs text-white focus:border-[#A78BFA] focus:outline-none"
                    />
                  </div>

                  {/* Bonus Gold */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-[var(--xp-gold)] font-semibold">Bonus Gold (0–250)</span>
                      <span className="font-bold text-[var(--xp-gold)]">+{bonusGold}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={250}
                      value={bonusGold}
                      onChange={(e) => setBonusGold(Math.max(0, Math.min(250, Number(e.target.value) || 0)))}
                      className="w-full rounded-lg border border-white/10 bg-[#080C14] px-3 py-1.5 text-xs text-white focus:border-[var(--xp-gold)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Spoils Summary */}
                <div className="border-t border-white/5 pt-1.5 flex items-center justify-between text-xs">
                  <span className="text-[var(--xp-text-muted)]">Total Victory Spoils:</span>
                  <div className="flex items-center gap-3 font-bold">
                    <span className="text-[#A78BFA]">+{xpReward + bonusXp} XP</span>
                    <span className="text-[var(--xp-gold)]">+{goldReward + bonusGold} Gold</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Sticky Action Footer */}
          <div className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 border-t border-white/[0.08] bg-[#0A0D16]/95 backdrop-blur-md flex items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold text-[var(--xp-text-muted)] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50 transition-all ${
                isBossMode
                  ? "rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-700/30 active:scale-95"
                  : "xp-btn-gold active:scale-95"
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2
                    className={`h-3.5 w-3.5 animate-spin ${
                      isBossMode ? "text-white" : "text-[#080C14]"
                    }`}
                  />
                  <span>
                    {isBossMode ? "Summoning Boss..." : "Creating Quest..."}
                  </span>
                </span>
              ) : isBossMode ? (
                "⚔ Summon Boss Event"
              ) : (
                "Create Quest"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
