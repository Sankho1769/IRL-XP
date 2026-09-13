// components/dashboard/QuestList.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ScrollText, Plus, ChevronRight } from "lucide-react";
import type { Quest } from "@/types/dashboard";
import type { CompleteQuestResult } from "@/app/actions/quests";
import { QuestCard } from "./QuestCard";
import { EmptyState } from "./EmptyState";

interface QuestListProps {
  quests: Quest[];
  importantQuestIds?: Set<string>;
  onToggleImportant?: (questId: string) => void;
  onQuestComplete?: (quest: Quest) => Promise<CompleteQuestResult | boolean | void | null> | CompleteQuestResult | boolean | void | null;
  onOpenNewQuest?: () => void;
  pendingQuestId?: string | null;
  title?: string;
  showNewQuestButton?: boolean;
  viewAllHref?: string;
}

export function QuestList({
  quests,
  importantQuestIds = new Set(),
  onToggleImportant,
  onQuestComplete,
  onOpenNewQuest,
  pendingQuestId,
  title = "Today's Quests",
  showNewQuestButton = true,
  viewAllHref = "/protected/quests",
}: QuestListProps) {
  // Sort quests: incomplete first, important first within same completion status
  const sortedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      const aImportant = importantQuestIds.has(a.id);
      const bImportant = importantQuestIds.has(b.id);

      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;

      if (aImportant && !bImportant) return -1;
      if (!aImportant && bImportant) return 1;

      return 0;
    });
  }, [quests, importantQuestIds]);

  const active = quests.filter((q) => !q.completed);
  const completedCount = quests.length - active.length;
  const hasNoQuestsAtAll = quests.length === 0;

  return (
    <section aria-label="Quests Panel" className="xp-panel p-5 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-rpg text-base sm:text-lg font-bold text-[var(--xp-text)] tracking-wide">
            {title}
          </h3>
          {!hasNoQuestsAtAll && (
            <span className="rounded-full border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-2.5 py-0.5 text-[11px] font-bold text-[var(--xp-gold)]">
              {completedCount}/{quests.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--xp-text-muted)] hover:text-[var(--xp-gold)] transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {showNewQuestButton && onOpenNewQuest && (
            <button
              type="button"
              onClick={onOpenNewQuest}
              className="xp-btn-gold hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>New Quest</span>
            </button>
          )}
        </div>
      </div>

      {/* Quests Rows Container */}
      {hasNoQuestsAtAll ? (
        <EmptyState
          icon={ScrollText}
          title="No active quests"
          description="Your journey begins with a single step. Forge a quest to start earning XP and attributes."
          actionLabel="Forge a Quest"
          onAction={onOpenNewQuest}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              completed={quest.completed}
              isImportant={importantQuestIds.has(quest.id)}
              onToggleImportant={onToggleImportant}
              pending={pendingQuestId === quest.id}
              onComplete={onQuestComplete}
            />
          ))}
        </div>
      )}

      {/* Inspiring Bottom Quote */}
      <div className="pt-2 border-t border-white/[0.04] text-center">
        <p className="text-[11px] text-[var(--xp-text-faint)] italic font-serif">
          &ldquo;Discipline today, a greater tomorrow.&rdquo;
        </p>
      </div>
    </section>
  );
}
