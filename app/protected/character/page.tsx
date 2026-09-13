// app/protected/character/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "../DashboardContext";
import {
  Coins,
  Flame,
  Dumbbell,
  Brain,
  Target,
  HeartPulse,
  Palette,
  Shield,
  Award,
  Sparkles,
  Store,
  CheckCircle2,
  Trophy,
  Lock,
} from "lucide-react";
import type { AttributeKey } from "@/types/dashboard";

const TIER_CARD_STYLES: Record<
  string,
  {
    border: string;
    bg: string;
    glow: string;
    text: string;
    badgeBg: string;
    badgeBorder: string;
  }
> = {
  Bronze: {
    border: "border-amber-700/40",
    bg: "bg-amber-950/20",
    glow: "shadow-[0_0_15px_rgba(205,127,50,0.15)]",
    text: "text-amber-500",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-600/30",
  },
  Silver: {
    border: "border-slate-400/40",
    bg: "bg-slate-800/20",
    glow: "shadow-[0_0_15px_rgba(203,213,225,0.15)]",
    text: "text-slate-300",
    badgeBg: "bg-slate-400/10",
    badgeBorder: "border-slate-400/30",
  },
  Gold: {
    border: "border-[var(--xp-border-gold)]",
    bg: "bg-[var(--xp-gold)]/5",
    glow: "shadow-[0_0_15px_rgba(229,184,105,0.2)]",
    text: "text-[var(--xp-gold)]",
    badgeBg: "bg-[var(--xp-gold)]/10",
    badgeBorder: "border-[var(--xp-border-gold)]",
  },
  Streak: {
    border: "border-orange-500/40",
    bg: "bg-orange-950/20",
    glow: "shadow-[0_0_15px_rgba(249,115,22,0.2)]",
    text: "text-orange-400",
    badgeBg: "bg-orange-500/10",
    badgeBorder: "border-orange-500/30",
  },
  Boss: {
    border: "border-red-500/40",
    bg: "bg-red-950/20",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    text: "text-red-400",
    badgeBg: "bg-red-500/10",
    badgeBorder: "border-red-500/30",
  },
  Diamond: {
    border: "border-sky-400/40",
    bg: "bg-sky-950/20",
    glow: "shadow-[0_0_15px_rgba(56,189,248,0.2)]",
    text: "text-sky-300",
    badgeBg: "bg-sky-400/10",
    badgeBorder: "border-sky-400/30",
  },
  Legendary: {
    border: "border-purple-500/40",
    bg: "bg-purple-950/20",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    text: "text-purple-300",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/30",
  },
};

function formatUnlockDate(isoString: string | null): string {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

const ATTRIBUTES_CONFIG: {
  key: AttributeKey;
  label: string;
  abbr: string;
  icon: typeof Dumbbell;
  color: string;
  bg: string;
  description: string;
}[] = [
  {
    key: "strength",
    label: "Strength",
    abbr: "STR",
    icon: Dumbbell,
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.15)",
    description: "Physical vitality, workout consistency, and bodily endurance.",
  },
  {
    key: "intelligence",
    label: "Intelligence",
    abbr: "INT",
    icon: Brain,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.15)",
    description: "Deep work capacity, analytical reading, and skill acquisition.",
  },
  {
    key: "discipline",
    label: "Discipline",
    abbr: "DIS",
    icon: Target,
    color: "#E5B869",
    bg: "rgba(229, 184, 105, 0.15)",
    description: "Habitual consistency, early rising, and resistance to distraction.",
  },
  {
    key: "health",
    label: "Health",
    abbr: "HEA",
    icon: HeartPulse,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.15)",
    description: "Physical restoration, balanced nutrition, hydration, and sleep.",
  },
  {
    key: "creativity",
    label: "Creativity",
    abbr: "CRE",
    icon: Palette,
    color: "#A78BFA",
    bg: "rgba(167, 139, 250, 0.15)",
    description: "Artistic expression, inventive design, and creative problem solving.",
  },
];

export default function CharacterPage() {
  const {
    player,
    character,
    presentationShopItems,
    userEmail,
    completedQuestIds,
    achievements,
  } = useDashboard();

  if (!player || !character) return null;

  const earnedTrophies = (achievements ?? []).filter((a) => a.isUnlocked);
  const lockedAchievements = (achievements ?? []).filter((a) => !a.isUnlocked);

  const ownedItems = presentationShopItems.filter((item) => item.owned);

  // Total attribute points
  const totalAttrPoints = Object.values(player.attributes).reduce(
    (sum, val) => sum + val,
    0
  );

  const xpPct = Math.max(
    5,
    Math.min(100, (player.currentXP / player.xpToNextLevel) * 100)
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Banner with Atmospheric Fortress Landscape */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--xp-border-gold)]/40 p-5 sm:p-6 shadow-xl group">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/story_landscape.jpg"
            alt="Hero Realm"
            className="h-full w-full object-cover object-[center_25%] opacity-45 filter brightness-100 contrast-115 scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/90 via-[#0A0F1D]/75 to-[#080C14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080C14_85%)]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)] block mb-1">
              ✧ Adventurer Record ✧
            </span>
            <h1 className="font-rpg text-2xl sm:text-3xl font-bold tracking-wide text-[var(--xp-text)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Your Character
            </h1>
            <p className="text-xs text-[var(--xp-text-muted)] mt-1 font-serif italic">
              Track your growth. Shape your legend.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--xp-border-gold)] bg-[#080C14]/80 backdrop-blur-md px-3.5 py-1.5 shadow-sm">
              <Coins className="h-4 w-4 text-[var(--xp-gold)]" />
              <span className="font-bold tabular-nums text-xs text-[var(--xp-gold)]">
                {player.gold.toLocaleString()} Gold
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Character Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Atmospheric Portrait & Hero Identity */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="xp-panel overflow-hidden border border-[var(--xp-border-gold)]/50 p-0 shadow-xl">
            <div className="relative h-72 sm:h-80 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/character_portrait.jpg"
                alt={player.name}
                className="h-full w-full object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/30 to-transparent" />

              {/* Level Badge Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-[var(--xp-border-gold)] bg-[#080C14]/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-[var(--xp-gold)] shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
                <span>Level {player.level}</span>
              </div>
            </div>

            <div className="p-6 pt-2 flex flex-col gap-4 bg-[#111827]">
              <div>
                <h2 className="font-rpg text-2xl font-bold text-[var(--xp-text)] leading-tight">
                  {player.name}
                </h2>
                <p className="text-xs font-semibold text-[var(--xp-gold)] mt-0.5 font-serif italic">
                  {player.title}
                </p>
                <p className="text-[11px] text-[var(--xp-text-faint)] mt-1">{userEmail}</p>
              </div>

              {/* XP Progress Bar */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--xp-text-muted)] font-medium">Level Progression</span>
                  <span className="font-bold tabular-nums text-[var(--xp-gold)]">
                    {player.currentXP.toLocaleString()} / {player.xpToNextLevel.toLocaleString()} XP
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/60 border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--xp-arcane)] via-[var(--xp-gold)] to-[var(--xp-gold-light)] shadow-[0_0_10px_rgba(229,184,105,0.5)] transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--xp-text-faint)] mt-0.5">
                  <span>Current Rank</span>
                  <span>Lifetime XP: <strong className="text-[var(--xp-text-muted)]">{character.xp.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Core RPG Attributes Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="xp-panel p-6 border border-white/[0.08] flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="font-rpg text-lg font-bold text-[var(--xp-text)]">
                  Attributes
                </h3>
                <p className="text-xs text-[var(--xp-text-muted)] mt-0.5">
                  Permanently augmented (+1) with every quest completed in the realm.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-[var(--xp-void-raised)] px-3 py-1 text-xs font-bold text-[var(--xp-gold)]">
                {totalAttrPoints} Total Points
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {ATTRIBUTES_CONFIG.map((attr) => {
                const val = player.attributes[attr.key] ?? 0;
                const fillPct = Math.min(100, Math.max(8, (val / 50) * 100));
                const Icon = attr.icon;

                return (
                  <div
                    key={attr.key}
                    className="flex flex-col gap-2 rounded-xl border border-white/[0.05] bg-[var(--xp-void-raised)]/70 p-4 transition-all hover:border-white/15"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                          style={{
                            backgroundColor: attr.bg,
                            borderColor: `${attr.color}40`,
                            color: attr.color,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--xp-text)]">
                            {attr.label}
                          </h4>
                          <p className="text-[11px] text-[var(--xp-text-muted)]">
                            {attr.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className="font-rpg text-xl font-extrabold tabular-nums"
                        style={{ color: attr.color }}
                      >
                        {val}
                      </span>
                    </div>

                    {/* Progress Fill */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/5 mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${fillPct}%`,
                          backgroundColor: attr.color,
                          boxShadow: `0 0 8px ${attr.color}70`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Stats Cards Strip matching reference */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="xp-panel-flat p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--xp-ember)]/30 bg-[var(--xp-ember)]/10 text-[var(--xp-ember)]">
            <Flame className="xp-streak-flame h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--xp-text-muted)] tracking-wider block">
              Day Streak
            </span>
            <span className="text-lg font-bold tabular-nums text-[var(--xp-text)] font-rpg">
              {player.streakDays} Days
            </span>
          </div>
        </div>

        <div className="xp-panel-flat p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--xp-text-muted)] tracking-wider block">
              Quests Done
            </span>
            <span className="text-lg font-bold tabular-nums text-[var(--xp-text)] font-rpg">
              {completedQuestIds.size}
            </span>
          </div>
        </div>

        <div className="xp-panel-flat p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 text-[var(--xp-gold)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--xp-text-muted)] tracking-wider block">
              Total Levels
            </span>
            <span className="text-lg font-bold tabular-nums text-[var(--xp-text)] font-rpg">
              Level {player.level}
            </span>
          </div>
        </div>

        <div className="xp-panel-flat p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--xp-text-muted)] tracking-wider block">
              Badges Earned
            </span>
            <span className="text-lg font-bold tabular-nums text-[var(--xp-text)] font-rpg">
              {ownedItems.length} Unlocked
            </span>
          </div>
        </div>
      </div>

      {/* Trophy Case Section */}
      <section
        role="region"
        aria-label="Trophy Case"
        className="xp-panel p-6 flex flex-col gap-6"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[var(--xp-gold)]" />
              <h3 className="font-rpg text-base sm:text-lg font-bold text-[var(--xp-text)]">
                Trophy Case
              </h3>
            </div>
            <p className="text-xs text-[var(--xp-text-muted)] mt-0.5 font-serif italic">
              Persistent honors carved into your adventurer ledger.
            </p>
          </div>

          <span className="self-start sm:self-auto rounded-full border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-3 py-1 text-xs font-bold text-[var(--xp-gold)] tabular-nums">
            {earnedTrophies.length} / {achievements.length || 8} Unlocked
          </span>
        </div>

        {/* 1. Earned Trophies */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--xp-text)]">
              Earned Honors
            </span>
            <span className="text-[11px] text-[var(--xp-text-muted)]">
              {earnedTrophies.length} Claimed
            </span>
          </div>

          {earnedTrophies.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[var(--xp-void-raised)]/40 p-6 text-center">
              <p className="text-xs text-[var(--xp-text-muted)] font-serif italic">
                No trophies claimed yet. Complete your first quest or vanquish a Boss Event to claim your first trophy.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {earnedTrophies.map((trophy) => {
                const style = TIER_CARD_STYLES[trophy.tier] ?? TIER_CARD_STYLES.Gold;
                return (
                  <div
                    key={trophy.id}
                    tabIndex={0}
                    role="article"
                    aria-label={`${trophy.name}, ${trophy.tier} tier trophy, unlocked on ${formatUnlockDate(trophy.unlockedAt)}`}
                    className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--xp-gold)] ${style.border} ${style.bg} ${style.glow}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className="text-3xl filter drop-shadow-md select-none group-hover:scale-110 transition-transform duration-300"
                          role="img"
                          aria-hidden="true"
                        >
                          {trophy.icon}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${style.badgeBg} ${style.badgeBorder} ${style.text}`}
                        >
                          {trophy.tier}
                        </span>
                      </div>
                      <h4 className="font-rpg text-sm font-bold text-[var(--xp-text)] leading-snug">
                        {trophy.name}
                      </h4>
                      <p className="text-[11px] text-[var(--xp-text-muted)] mt-1 font-serif italic">
                        {trophy.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-medium">Earned</span>
                      <span className="text-[var(--xp-text-faint)] tabular-nums">
                        {formatUnlockDate(trophy.unlockedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--xp-text-muted)]">
                In Pursuit
              </span>
              <span className="text-[11px] text-[var(--xp-text-faint)]">
                {lockedAchievements.length} Remaining
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {lockedAchievements.map((item) => (
                <div
                  key={item.id}
                  tabIndex={0}
                  role="article"
                  aria-label={`${item.name}, locked. Requirement: ${item.description}`}
                  className="group relative flex flex-col justify-between rounded-xl border border-white/[0.06] bg-[var(--xp-void-raised)]/40 p-4 opacity-75 hover:opacity-100 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className="text-2xl filter grayscale opacity-40 select-none group-hover:opacity-70 transition-opacity"
                        role="img"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <div className="flex items-center gap-1 rounded bg-black/40 border border-white/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--xp-text-faint)]">
                        <Lock className="h-2.5 w-2.5" />
                        <span>Locked</span>
                      </div>
                    </div>
                    <h4 className="font-rpg text-xs sm:text-sm font-bold text-[var(--xp-text-muted)] leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[var(--xp-text-faint)] mt-1 font-serif italic">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                    <span className="text-[var(--xp-text-faint)]">{item.tier} Tier</span>
                    <span className="text-[var(--xp-text-faint)] font-mono">Milestone</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Inventory & Equipment Showcase */}
      <section className="xp-panel p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="font-rpg text-base sm:text-lg font-bold text-[var(--xp-text)]">
              Equipment & Unlocked Cosmetics
            </h3>
            <p className="text-xs text-[var(--xp-text-muted)] mt-0.5">
              Items acquired through the bazaar using your quest rewards.
            </p>
          </div>

          <Link
            href="/protected/shop"
            className="xp-btn-gold-outline flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Visit Shop</span>
          </Link>
        </div>

        {ownedItems.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-[var(--xp-void-raised)]/50 p-8 text-center flex flex-col items-center">
            <Shield className="h-10 w-10 text-[var(--xp-text-faint)] mb-2" />
            <h4 className="text-sm font-bold text-[var(--xp-text)]">No items in your equipment pouch</h4>
            <p className="text-xs text-[var(--xp-text-muted)] mt-1 max-w-sm font-serif italic">
              Complete quests to harvest gold, then browse the bazaar to unlock themes, titles, and badges.
            </p>
            <Link
              href="/protected/shop"
              className="xp-btn-gold mt-4 px-4 py-2 text-xs font-bold"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {ownedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--xp-text)] truncate">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block mt-0.5">
                    {item.category} • Owned
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quote */}
      <div className="pt-2 text-center">
        <p className="text-xs text-[var(--xp-text-faint)] italic font-serif">
          &ldquo;A little progress each day adds up to big results.&rdquo;
        </p>
      </div>
    </div>
  );
}
