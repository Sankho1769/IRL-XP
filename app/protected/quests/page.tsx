// app/protected/quests/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { QuestCard } from "@/components/dashboard/QuestCard";
import { QuestBoardView } from "@/components/dashboard/QuestBoardView";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Search, Plus, ScrollText, List, LayoutGrid } from "lucide-react";
import { QuillScribeAnimation, useQuillTyping } from "@/components/dashboard/QuillScribeAnimation";

type FilterTab = "all" | "daily" | "weekly" | "custom" | "boss" | "important" | "completed";

export default function QuestsPage() {
  const {
    presentationQuests,
    completedQuestIds,
    importantQuestIds,
    toggleImportantQuest,
    handleQuestComplete,
    pendingQuestId,
    setIsNewQuestModalOpen,
    handleQuestDelete,
  } = useDashboard();

  const [viewMode, setViewMode] = useState<"list" | "board">(() => {
    if (typeof window === "undefined") return "board";
    try {
      const saved = localStorage.getItem("irl_xp_quest_view_preference");
      return saved === "list" ? "list" : "board";
    } catch {
      return "board";
    }
  });

  const handleViewModeChange = (mode: "list" | "board") => {
    setViewMode(mode);
    try {
      localStorage.setItem("irl_xp_quest_view_preference", mode);
    } catch {
      // ignore
    }
  };

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { isTyping: isSearchTyping, registerTyping: registerSearchTyping } = useQuillTyping(800);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: presentationQuests.length,
      daily: presentationQuests.filter((q) => q.frequency === "daily" && q.questType !== "boss").length,
      weekly: presentationQuests.filter((q) => q.frequency === "weekly" && q.questType !== "boss").length,
      custom: presentationQuests.filter((q) => q.questType === "habit" && Boolean(q.deadlineAt)).length,
      boss: presentationQuests.filter((q) => q.questType === "boss").length,
      important: presentationQuests.filter((q) => importantQuestIds.has(q.id)).length,
      completed: presentationQuests.filter((q) => q.completed).length,
    };
  }, [presentationQuests, importantQuestIds]);

  // Filtered & searched quests
  const filteredQuests = useMemo(() => {
    let list = presentationQuests;

    // Filter by active tab
    if (activeFilter === "daily") {
      list = list.filter((q) => q.frequency === "daily" && q.questType !== "boss");
    } else if (activeFilter === "weekly") {
      list = list.filter((q) => q.frequency === "weekly" && q.questType !== "boss");
    } else if (activeFilter === "custom") {
      list = list.filter((q) => q.questType === "habit" && Boolean(q.deadlineAt));
    } else if (activeFilter === "boss") {
      list = list.filter((q) => q.questType === "boss");
    } else if (activeFilter === "important") {
      list = list.filter((q) => importantQuestIds.has(q.id));
    } else if (activeFilter === "completed") {
      list = list.filter((q) => q.completed);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (quest) =>
          quest.title.toLowerCase().includes(q) ||
          quest.description.toLowerCase().includes(q) ||
          quest.category.toLowerCase().includes(q) ||
          (q === "boss" && quest.questType === "boss")
      );
    }

    // Sort: incomplete first, boss first, important (imp) first, less time remaining (earliest deadline) first
    return [...list].sort((a, b) => {
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;

      const aBoss = a.questType === "boss";
      const bBoss = b.questType === "boss";
      if (aBoss && !bBoss) return -1;
      if (!aBoss && bBoss) return 1;

      // 1. Important (imp) first
      const aImportant = importantQuestIds.has(a.id);
      const bImportant = importantQuestIds.has(b.id);
      if (aImportant && !bImportant) return -1;
      if (!aImportant && bImportant) return 1;

      // 2. Less time remaining (earliest deadline) first
      const aTime = a.deadlineAt ? new Date(a.deadlineAt).getTime() : null;
      const bTime = b.deadlineAt ? new Date(b.deadlineAt).getTime() : null;
      if (aTime !== null && bTime !== null) {
        if (aTime !== bTime) return aTime - bTime;
      } else if (aTime !== null && bTime === null) {
        return -1;
      } else if (aTime === null && bTime !== null) {
        return 1;
      }

      return 0;
    });
  }, [presentationQuests, activeFilter, searchQuery, importantQuestIds]);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "daily", label: "Today", count: counts.daily },
    { key: "weekly", label: "This Week", count: counts.weekly },
    { key: "custom", label: "One-Time", count: counts.custom },
    { key: "boss", label: "Boss", count: counts.boss },
    { key: "important", label: "Important", count: counts.important },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner: Styled as an Epic RPG Guild Notice Board Command Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--xp-border-gold)]/40 p-5 sm:p-6 shadow-xl group">
        {/* Background Artwork Layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/quest_realm_bg.jpg"
            alt="Quest Realm Citadel"
            className="h-full w-full object-cover object-[center_35%] opacity-50 filter brightness-100 contrast-115 scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/90 via-[#0A0F1D]/75 to-[#080C14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080C14_85%)]" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)]">
                ✧ Adventurer&apos;s Chronicle ✧
              </span>
            </div>
            <h1 className="font-rpg text-2xl sm:text-3xl font-bold tracking-wider text-[var(--xp-text)] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Guild Quest Board
            </h1>
            <p className="text-xs text-[var(--xp-text-muted)] mt-1 font-serif italic uppercase tracking-wider">
              Turn your daily trials into legendary real-life progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented View Switcher */}
            <div
              role="tablist"
              aria-label="Quest View"
              className="flex items-center rounded-xl bg-[#080C14]/80 backdrop-blur-md p-1 border border-white/15 shadow-inner"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "list"}
                onClick={() => handleViewModeChange("list")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[var(--xp-gold)] text-[#080C14] shadow-md shadow-[var(--xp-gold)]/20"
                    : "text-[var(--xp-text-muted)] hover:text-white"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "board"}
                onClick={() => handleViewModeChange("board")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "board"
                    ? "bg-[var(--xp-gold)] text-[#080C14] shadow-md shadow-[var(--xp-gold)]/20"
                    : "text-[var(--xp-text-muted)] hover:text-white"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Board View</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsNewQuestModalOpen(true)}
              className="xp-btn-gold flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>+ New Quest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls (Available in both Board View & List View) */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F1D]/75 backdrop-blur-md p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map(({ key, label, count }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)] shadow-sm shadow-[var(--xp-gold)]/10"
                    : "border border-white/5 bg-[#0D1322]/80 text-[var(--xp-text-muted)] hover:text-[var(--xp-text)] hover:border-white/15"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-[var(--xp-gold)] text-[#080C14]"
                      : "bg-white/10 text-[var(--xp-text-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search quest log..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              registerSearchTyping();
            }}
            onKeyDown={registerSearchTyping}
            className={`w-full rounded-xl border bg-[#0D1322] pl-9 pr-10 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-all ${
              isSearchTyping
                ? "border-amber-400/80 shadow-[0_0_12px_rgba(245,195,98,0.25)]"
                : "border-white/10 focus:border-[var(--xp-border-gold)]"
            }`}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <QuillScribeAnimation
              isTyping={isSearchTyping}
              size="xs"
              showInkDrops={true}
            />
          </div>
        </div>
      </div>

      {/* Quests View: Board View or List View */}
      {filteredQuests.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={
            searchQuery.trim()
              ? "No quests match your search"
              : activeFilter === "important"
              ? "No important quests flagged"
              : activeFilter === "completed"
              ? "No completed quests yet"
              : activeFilter === "boss"
              ? "No boss events summoned"
              : activeFilter === "custom"
              ? "No custom date quests found"
              : "No quests found"
          }
          description={
            searchQuery.trim()
              ? `No quest entries found for "${searchQuery}". Clear your search query or select another category.`
              : activeFilter === "important"
              ? "Click the star icon next to any quest to flag it as important."
              : activeFilter === "boss"
              ? "Summon a Boss Event to test your resolve against real-world deadlines."
              : activeFilter === "custom"
              ? "Create a quick quest with a custom deadline date and time."
              : "Forge your first quest to begin leveling up your attributes."
          }
          actionLabel={
            searchQuery.trim()
              ? "Clear search"
              : activeFilter === "boss"
              ? "Summon Boss Event"
              : "Forge a quest"
          }
          onAction={
            searchQuery.trim()
              ? () => setSearchQuery("")
              : () => setIsNewQuestModalOpen(true)
          }
        />
      ) : viewMode === "board" ? (
        <QuestBoardView
          quests={filteredQuests}
          activeFilter={activeFilter}
          completedQuestIds={completedQuestIds}
          importantQuestIds={importantQuestIds}
          toggleImportantQuest={toggleImportantQuest}
          handleQuestComplete={handleQuestComplete}
          pendingQuestId={pendingQuestId}
          onOpenNewQuestModal={() => setIsNewQuestModalOpen(true)}
          onDelete={handleQuestDelete}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              completed={quest.completed}
              isImportant={importantQuestIds.has(quest.id)}
              onToggleImportant={toggleImportantQuest}
              pending={pendingQuestId === quest.id}
              onComplete={handleQuestComplete}
            />
          ))}
        </div>
      )}

      {/* Bottom Quote */}
      <div className="pt-4 border-t border-white/[0.04] text-center">
        <p className="text-xs text-[var(--xp-text-faint)] italic font-serif">
          &ldquo;Discipline today, a greater tomorrow.&rdquo;
        </p>
      </div>
    </div>
  );
}
