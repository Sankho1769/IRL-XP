"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "./DashboardContext";
import { StoryChapterCard } from "@/components/dashboard/StoryChapterCard";
import { QuickStatsStrip } from "@/components/dashboard/QuickStatsStrip";
import { QuestList } from "@/components/dashboard/QuestList";
import { QuestCard } from "@/components/dashboard/QuestCard";
import { CharacterStatus } from "@/components/dashboard/CharacterStatus";
import { Swords, Timer } from "lucide-react";

export default function HomePage() {
  const {
    player,
    presentationQuests,
    completedQuestIds,
    importantQuestIds,
    toggleImportantQuest,
    handleQuestComplete,
    pendingQuestId,
    setIsNewQuestModalOpen,
    hasCompletedAnyQuest,
  } = useDashboard();

  // Lightweight tick to refresh active boss deadline comparisons
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeBossQuests = useMemo(
    () =>
      presentationQuests.filter(
        (q) =>
          q.questType === "boss" &&
          !q.completed &&
          Boolean(q.deadlineAt) &&
          new Date(q.deadlineAt!).getTime() > now
      ),
    [presentationQuests, now]
  );

  const regularQuests = useMemo(
    () => presentationQuests.filter((q) => q.questType !== "boss"),
    [presentationQuests]
  );

  if (!player) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Multi-column RPG Composition */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Column: Story Banner + Quick Stats + Focus Banner + Boss Events + Active Quests */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* A. Cinematic Current Story Panel */}
          <div className="xp-entrance-0">
            <StoryChapterCard
              level={player.level}
              streak={player.streakDays}
              hasCompletedQuest={hasCompletedAnyQuest}
            />
          </div>

          {/* B. 4-Pill Quick Stats */}
          <div className="xp-entrance-1">
            <QuickStatsStrip
              level={player.level}
              streakDays={player.streakDays}
              gold={player.gold}
              completedQuestsCount={completedQuestIds.size}
            />
          </div>

          {/* C. Focus Chamber Quick Action */}
          <div className="xp-entrance-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-[#0E1526] via-[var(--xp-panel)] to-[#080C14] px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 text-[var(--xp-gold)]">
                  <Timer className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">Focus Chamber</span>
                  <p className="text-[10px] text-[var(--xp-text-muted)]">Deep work sessions with zero distractions</p>
                </div>
              </div>
              <Link
                href="/protected/focus"
                className="xp-btn-gold flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
              >
                <Timer className="h-3.5 w-3.5" />
                <span>Focus Mode</span>
              </Link>
            </div>
          </div>

          {/* D. Major Quest Panel + Active Boss Events */}
          <div className="xp-entrance-3 flex flex-col gap-6">
            {/* Active Boss Events Section (when bosses are active) */}
            {activeBossQuests.length > 0 && (
              <section aria-label="Active Boss Events" className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-r from-red-950/40 via-[#12182b] to-[#080C14] p-5 shadow-lg shadow-red-950/40 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-sm shadow-red-600/50">
                      <Swords className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-rpg text-base sm:text-lg font-bold text-red-100 tracking-wide">
                        Active Boss Events
                      </h3>
                      <p className="text-[11px] text-red-300/70 font-serif italic">
                        Conquer before the deadline strikes to claim legendary spoils.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-red-300">
                    {activeBossQuests.length} {activeBossQuests.length === 1 ? "Boss" : "Bosses"}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {activeBossQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      completed={quest.completed}
                      pending={pendingQuestId === quest.id}
                      onComplete={handleQuestComplete}
                    />
                  ))}
                </div>
              </section>
            )}

            <QuestList
              title="Active Quests"
              quests={regularQuests}
              importantQuestIds={importantQuestIds}
              onToggleImportant={toggleImportantQuest}
              onQuestComplete={handleQuestComplete}
              pendingQuestId={pendingQuestId}
              onOpenNewQuest={() => setIsNewQuestModalOpen(true)}
              showNewQuestButton={true}
              viewAllHref="/protected/quests"
            />
          </div>
        </div>

        {/* Right Column: Character Summary */}
        <div className="flex flex-col gap-6 lg:col-span-4 xp-entrance-1">
          <CharacterStatus player={player} />
        </div>
      </div>
    </div>
  );
}
