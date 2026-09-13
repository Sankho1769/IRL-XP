// lib/mock/dashboard-mock-data.ts
//
// MOCK DATA ONLY. This file exists purely so the presentation layer
// has realistic shapes to render while backend integration is being
// built by the other Claude instance.
//
// When ready, replace calls to `getMockDashboardData()` with the real
// server action (e.g. `app/actions/dashboard.ts`) that queries
// Supabase. No component below should need to change shape-wise —
// see types/dashboard.ts for the contract both sides share.

import type { DashboardData } from "@/types/dashboard";

export function getMockDashboardData(): DashboardData {
  return {
    player: {
      id: "mock-player-1",
      name: "Aria Chen",
      title: "Rank 7 Wayfinder",
      avatarUrl: null,
      level: 7,
      currentXP: 340,
      xpToNextLevel: 500,
      gold: 1280,
      streakDays: 12,
      attributes: {
        strength: 62,
        intelligence: 78,
        discipline: 54,
        health: 45,
        creativity: 70,
      },
    },
    quests: [
      {
        id: "q1",
        title: "Morning Ritual",
        description: "Wake up before 7am and drink a full glass of water.",
        category: "discipline",
        xpReward: 25,
        goldReward: 10,
        frequency: "daily",
        completed: false,
        questType: "habit",
        deadlineAt: null,
        bonusXpReward: 0,
        bonusGoldReward: 0,
      },
      {
        id: "q2",
        title: "Iron Session",
        description: "Complete a 30-minute strength training workout.",
        category: "strength",
        xpReward: 60,
        goldReward: 25,
        frequency: "daily",
        completed: false,
        questType: "habit",
        deadlineAt: null,
        bonusXpReward: 0,
        bonusGoldReward: 0,
      },
      {
        id: "q3",
        title: "Deep Work Block",
        description: "Focus on one task, no phone, for 90 uninterrupted minutes.",
        category: "intelligence",
        xpReward: 80,
        goldReward: 30,
        frequency: "daily",
        completed: true,
        questType: "habit",
        deadlineAt: null,
        bonusXpReward: 0,
        bonusGoldReward: 0,
      },
      {
        id: "q4",
        title: "Sketch Something",
        description: "Draw, doodle, or design anything for at least 15 minutes.",
        category: "creativity",
        xpReward: 40,
        goldReward: 15,
        frequency: "daily",
        completed: false,
        questType: "habit",
        deadlineAt: null,
        bonusXpReward: 0,
        bonusGoldReward: 0,
      },
      {
        id: "q5",
        title: "Meal Prep Sunday",
        description: "Prepare healthy meals for the next 3 days.",
        category: "health",
        xpReward: 100,
        goldReward: 40,
        frequency: "weekly",
        completed: false,
        questType: "habit",
        deadlineAt: null,
        bonusXpReward: 0,
        bonusGoldReward: 0,
      },
      {
        id: "q6",
        title: "Submit Research Grant",
        description: "Finalize all grant documentation and submit the proposal before the review board convenes.",
        category: "intelligence",
        xpReward: 100,
        goldReward: 50,
        frequency: "once",
        completed: false,
        questType: "boss",
        deadlineAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        bonusXpReward: 300,
        bonusGoldReward: 150,
      },
      {
        id: "q7",
        title: "Inbox Zero",
        description: "Clear out your email inbox completely, once.",
        category: "discipline",
        xpReward: 100,
        goldReward: 40,
        frequency: "once",
        completed: false,
        questType: "habit",
        deadlineAt: new Date(Date.now() + 86400000).toISOString(),
        bonusXpReward: 0,
        bonusGoldReward: 0,
      },
    ],
    shopItems: [
      {
        id: "s1",
        name: "Ember Cloak",
        description: "A cosmetic cloak with a slow-burning ember trim.",
        price: 500,
        icon: "Flame",
        owned: false,
        category: "cosmetic",
      },
      {
        id: "s3",
        name: '"The Relentless" Title',
        description: "Display this title on your profile and leaderboard.",
        price: 800,
        icon: "Crown",
        owned: true,
        category: "title",
      },
      {
        id: "s5",
        name: "Starlit Avatar Frame",
        description: "A cosmetic frame that shimmers around your avatar.",
        price: 420,
        icon: "Sparkles",
        owned: false,
        category: "cosmetic",
      },
      {
        id: "s6",
        name: "Focus Potion",
        description: "Cosmetic glow effect on your Deep Work quests for a week.",
        price: 180,
        icon: "FlaskConical",
        owned: false,
        category: "cosmetic",
      },
    ],
  };
}

// Convenience export for scenarios/screens that need to demo the
// empty states without wiring up separate logic in each component.
export function getEmptyDashboardData(): DashboardData {
  const base = getMockDashboardData();
  return {
    ...base,
    quests: [],
    shopItems: [],
  };
}
