// components/dashboard/StoryChapterCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Sparkles, ArrowRight } from "lucide-react";

interface StoryChapterCardProps {
  level: number;
  streak: number;
  hasCompletedQuest: boolean;
}

export function StoryChapterCard({
  level,
  streak,
  hasCompletedQuest,
}: StoryChapterCardProps) {
  const milestone1 = hasCompletedQuest;
  const milestone2 = streak >= 1;
  const milestone3 = level >= 2;

  const completedCount =
    (milestone1 ? 1 : 0) + (milestone2 ? 1 : 0) + (milestone3 ? 1 : 0);
  const totalCount = 3;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const currentChapterTitle = level >= 2 ? "Chapter 2: The First Trial" : "Chapter 1: The Beginning";
  const chapterSubtitle = level >= 2 
    ? "The road ahead grows steeper. Can you maintain focus when motivation fades?"
    : "You have awakened to a greater path. Transform mundane routines into heroic achievements.";

  return (
    <article className="xp-panel relative overflow-hidden p-0 border border-[var(--xp-border-gold)]/40 shadow-xl group">
      {/* Background Cinematic Artwork Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[220px]">
        {/* Landscape Image Banner */}
        <div className="relative md:col-span-5 h-48 md:h-auto overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/story_landscape.jpg"
            alt="Chapter Story Landscape"
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-[#0D1322]/40 to-[#0D1322]" />
          
          {/* Badge over image */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full border border-[var(--xp-border-gold)] bg-[#080C14]/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-[var(--xp-gold)] uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Season I • The Awakening</span>
          </div>
        </div>

        {/* Narrative & Progress Content */}
        <div className="md:col-span-7 flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-b md:bg-gradient-to-r from-[#0D1322] to-[#111827]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)]">
                Current Chapter
              </span>
              <span className="text-xs font-semibold tabular-nums text-[var(--xp-gold)]">
                {progressPercent}% Complete
              </span>
            </div>

            <h2 className="font-rpg text-xl sm:text-2xl font-bold text-[var(--xp-text)] leading-tight tracking-wide">
              {currentChapterTitle}
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-[var(--xp-text-muted)] font-serif italic line-clamp-2 sm:line-clamp-3">
              &ldquo;{chapterSubtitle}&rdquo;
            </p>
          </div>

          {/* Chapter Progress Bar + Action */}
          <div className="mt-5 flex flex-col gap-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--xp-arcane)] via-[var(--xp-gold)] to-[var(--xp-gold-light)] transition-all duration-700 shadow-[0_0_10px_rgba(229,184,105,0.4)]"
                style={{ width: `${Math.max(4, progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-[var(--xp-text-faint)]">
                Milestones: <strong className="text-[var(--xp-text-muted)]">{completedCount} of {totalCount}</strong> unlocked
              </span>

              <Link
                href="/protected/story"
                className="xp-btn-gold-outline flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
              >
                <span>View Story</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
