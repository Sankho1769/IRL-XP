// app/protected/story/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "../DashboardContext";
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronRight,
  Shield,
  Compass,
} from "lucide-react";

export default function StoryPage() {
  const { player, hasCompletedAnyQuest } = useDashboard();

  if (!player) return null;

  // Real milestone progression calculations
  const m1Complete = hasCompletedAnyQuest;
  const m2Complete = player.streakDays >= 1;
  const m3Complete = player.level >= 2;

  const completedCount =
    (m1Complete ? 1 : 0) + (m2Complete ? 1 : 0) + (m3Complete ? 1 : 0);
  const totalCount = 3;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const chapter1Cleared = completedCount === totalCount;

  // Journey milestones track matching reference
  const JOURNEY_NODES = [
    { title: "Prologue", subtitle: "Begin your journey", unlocked: true, current: !chapter1Cleared },
    { title: "Discipline", subtitle: "The First Trials", unlocked: chapter1Cleared || player.level >= 2, current: chapter1Cleared && player.level < 5 },
    { title: "Growth", subtitle: "Into the Unknown", unlocked: player.level >= 5, current: player.level >= 5 && player.level < 8 },
    { title: "Mastery", subtitle: "A New You", unlocked: player.level >= 8, current: player.level >= 8 && player.level < 10 },
    { title: "Legend", subtitle: "The Best Version", unlocked: player.level >= 10, current: player.level >= 10 },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Banner with Atmospheric Chronicler Landscape */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--xp-border-gold)]/40 p-5 sm:p-6 shadow-xl group">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/story_landscape.jpg"
            alt="The Grand Chronicle"
            className="h-full w-full object-cover object-[center_35%] opacity-50 filter brightness-100 contrast-115 scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/90 via-[#0A0F1D]/75 to-[#080C14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080C14_85%)]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)] block mb-1">
              ✧ Season I • The Awakening ✧
            </span>
            <h1 className="font-rpg text-2xl sm:text-3xl font-bold tracking-wide text-[var(--xp-text)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Your Living Story
            </h1>
            <p className="text-xs text-[var(--xp-text-muted)] mt-1 font-serif italic">
              A grand chronicle shaped by your daily real-life choices and triumphs.
            </p>
          </div>

          <div className="text-right sm:max-w-xs bg-[#080C14]/70 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-sm">
            <p className="text-xs text-[var(--xp-text-muted)] font-serif italic">
              &ldquo;Great journeys begin with small steps.&rdquo;
            </p>
            <span className="text-[10px] text-[var(--xp-gold)] font-bold tracking-wider uppercase block mt-0.5">
              — The Chronicler
            </span>
          </div>
        </div>
      </div>

      {/* Visual Journey Nodes Map matching reference 1 top-right */}
      <section className="xp-panel p-6 sm:p-8 relative overflow-hidden border border-[var(--xp-border-gold)]/40">
        {/* Campaign Map Blueprint Texture Layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/vintage_blueprint.jpg"
            alt=""
            className="h-full w-full object-cover object-center filter brightness-110 contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/60 via-[#111827]/85 to-[#111827]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--xp-gold)] flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Campaign Progression
            </span>
            <span className="text-xs text-[var(--xp-text-muted)] font-serif italic">
              Level {player.level} Adventurer
            </span>
          </div>

          {/* Connected Pathway */}
          <div className="relative flex items-center justify-between gap-2 overflow-x-auto py-4 scrollbar-none">
            {/* Background connecting rail */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />

            {JOURNEY_NODES.map((node, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2 min-w-[90px] text-center">
                {/* Node Orb */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    node.current
                      ? "border-[var(--xp-gold)] bg-[var(--xp-gold)]/20 shadow-[0_0_15px_rgba(229,184,105,0.6)] scale-110"
                      : node.unlocked
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-white/10 bg-[#080C14] text-[var(--xp-text-faint)]"
                  }`}
                >
                  {node.unlocked ? (
                    <Sparkles
                      className={`h-5 w-5 ${node.current ? "text-[var(--xp-gold)]" : "text-emerald-400"}`}
                    />
                  ) : (
                    <Lock className="h-4 w-4 text-[var(--xp-text-faint)]" />
                  )}
                </div>

                {/* Node Labels */}
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      node.current
                        ? "text-[var(--xp-gold)]"
                        : node.unlocked
                        ? "text-[var(--xp-text)]"
                        : "text-[var(--xp-text-faint)]"
                    }`}
                  >
                    {node.title}
                  </span>
                  <span className="text-[10px] text-[var(--xp-text-muted)] leading-none mt-0.5 block">
                    {node.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Large Cinematic Current Story Panel */}
      <section className="xp-panel overflow-hidden border border-[var(--xp-border-gold)]/50 shadow-2xl p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
          {/* Visual Artwork Left Banner */}
          <div className="relative lg:col-span-6 h-64 lg:h-auto overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/story_landscape.jpg"
              alt="Story Citadel"
              className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-[#0D1322]/50 to-[#0D1322]" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="rounded-full border border-[var(--xp-border-gold)] bg-[#080C14]/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-[var(--xp-gold)] uppercase tracking-wider">
                Volume I • The Awakening
              </span>
            </div>
          </div>

          {/* Story Narrative & Real Milestones */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b lg:bg-gradient-to-r from-[#0D1322] to-[#111827]">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--xp-gold)]">
                  Chapter 1: The Beginning
                </span>
                <span className="rounded-md border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--xp-gold)] uppercase">
                  {chapter1Cleared ? "Cleared" : "Active"}
                </span>
              </div>

              <h2 className="font-rpg text-2xl sm:text-3xl font-bold text-[var(--xp-text)] leading-tight tracking-wide">
                A New Beginning
              </h2>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[var(--xp-text-muted)] font-serif italic border-l-2 border-[var(--xp-gold)]/40 pl-3.5 py-1">
                &ldquo;You have taken the first step. The road ahead will not always be easy, but every effort you make in reality will shape a stronger, wiser you. Prove to yourself that lasting change is possible.&rdquo;
              </p>
            </div>

            {/* Milestones Card */}
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-white/5 bg-[var(--xp-void-raised)]/70 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--xp-text)]">Chapter Progress</span>
                <span className="font-bold text-[var(--xp-gold)] tabular-nums">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--xp-arcane)] via-[var(--xp-gold)] to-[var(--xp-gold-light)] shadow-[0_0_10px_rgba(229,184,105,0.4)] transition-all duration-700"
                  style={{ width: `${Math.max(4, progressPercent)}%` }}
                />
              </div>

              {/* Real Milestone Items */}
              <ul className="mt-2 flex flex-col gap-2 text-xs">
                <li
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    m1Complete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/5 bg-white/[0.02] text-[var(--xp-text-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {m1Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[var(--xp-text-faint)] shrink-0" />
                    )}
                    <span className="font-medium">Complete first quest</span>
                  </div>
                  <span className="font-bold text-[10px] tracking-wider uppercase">
                    {m1Complete ? "Completed" : "Incomplete"}
                  </span>
                </li>

                <li
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    m2Complete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/5 bg-white/[0.02] text-[var(--xp-text-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {m2Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[var(--xp-text-faint)] shrink-0" />
                    )}
                    <span className="font-medium">Build a streak (1+ days)</span>
                  </div>
                  <span className="font-bold text-[10px] tracking-wider uppercase">
                    {m2Complete ? `${player.streakDays}d Active` : "Incomplete"}
                  </span>
                </li>

                <li
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    m3Complete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/5 bg-white/[0.02] text-[var(--xp-text-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {m3Complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[var(--xp-text-faint)] shrink-0" />
                    )}
                    <span className="font-medium">Reach Level 2</span>
                  </div>
                  <span className="font-bold text-[10px] tracking-wider uppercase">
                    {m3Complete ? `Level ${player.level}` : "Incomplete"}
                  </span>
                </li>
              </ul>

              <div className="pt-2 flex items-center justify-end">
                <Link
                  href="/protected/quests"
                  className="xp-btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                >
                  <span>Continue Quests</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locked Future Chapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chapter 2 */}
        <div className="xp-panel-flat p-5 border border-white/5 opacity-75 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--xp-text-faint)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--xp-text-faint)]">
                Chapter 2
              </span>
            </div>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[var(--xp-text-faint)]">
              Req: Level 2
            </span>
          </div>
          <h3 className="font-rpg text-lg font-bold text-[var(--xp-text-muted)]">
            The First Trial
          </h3>
          <p className="mt-1.5 text-xs text-[var(--xp-text-faint)] leading-relaxed">
            The path ahead is no longer easy. When morning comfort calls, can you conquer friction and stay consistent?
          </p>
        </div>

        {/* Chapter 3 */}
        <div className="xp-panel-flat p-5 border border-white/5 opacity-60 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--xp-text-faint)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--xp-text-faint)]">
                Chapter 3
              </span>
            </div>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[var(--xp-text-faint)]">
              Req: Level 5
            </span>
          </div>
          <h3 className="font-rpg text-lg font-bold text-[var(--xp-text-muted)]">
            The Rising
          </h3>
          <p className="mt-1.5 text-xs text-[var(--xp-text-faint)] leading-relaxed">
            Ascend above routine into true mastery. Multi-faceted trials of intellect and discipline await the persistent.
          </p>
        </div>
      </div>
    </div>
  );
}
