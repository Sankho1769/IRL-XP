// components/dashboard/ProtectedShell.tsx
"use client";

import React, { useState } from "react";
import "@/styles/dashboard.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { LevelUpOverlay } from "./LevelUpOverlay";
import { NewQuestModal } from "./NewQuestModal";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import SignOutButton from "@/app/protected/sign-out-button";
import { useDashboard } from "@/app/protected/DashboardContext";
import { Shield, Sparkles, LogOut, Settings, X } from "lucide-react";
import { IRLXPPageLoader } from "@/components/ui/IRLXPPageLoader";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";

const TOP_NAV_ITEMS = [
  { href: "/protected", label: "Home" },
  { href: "/protected/quests", label: "Quests" },
  { href: "/protected/character", label: "Character" },
  { href: "/protected/shop", label: "Shop" },
  { href: "/protected/story", label: "Story" },
];

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFocusPage = pathname === "/protected/focus";
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const {
    player,
    theme,
    showProfileModal,
    setShowProfileModal,
    error,
    clearError,
    successMessage,
    dismissSuccessMessage,
    levelUpTo,
    levelUpOldLevel,
    dismissLevelUp,
    isNewQuestModalOpen,
    setIsNewQuestModalOpen,
    handleQuestCreated,
  } = useDashboard();

  const displayGold = useAnimatedNumber(player?.gold ?? 0);

  if (!player) {
    if (!error) {
      return <IRLXPPageLoader initialMessage="Preparing your adventure..." />;
    }

    return (
      <div className="xp-scope flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-10 w-10 rounded-full border border-[var(--xp-border-gold)] flex items-center justify-center bg-[var(--xp-gold)]/10 text-[var(--xp-gold)]">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <p className="text-sm text-[var(--xp-text-muted)] font-serif">
          {error === "CHARACTER_NOT_FOUND"
            ? "No character found for this adventurer yet."
            : error}
        </p>
        <SignOutButton />
      </div>
    );
  }

  // Full-screen chamber for Focus Mode
  if (isFocusPage) {
    return (
      <div className="xp-scope min-h-screen bg-[#080C14]" data-theme={theme}>
        {children}
        {levelUpTo !== null && (
          <LevelUpOverlay
            level={levelUpTo}
            oldLevel={levelUpOldLevel ?? undefined}
            onDismiss={dismissLevelUp}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="xp-scope min-h-screen relative bg-[#080C14] text-[var(--xp-text)] overflow-x-hidden"
      data-theme={theme}
    >
      {/* Cinematic RPG Atmosphere Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/quest_realm_bg.jpg"
          alt=""
          className="h-full w-full object-cover object-center opacity-75 filter brightness-100 contrast-120 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080C14]/40 via-[#080C14]/20 to-[#080C14]/60" />
        {/* Radial vignette spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#080C14_85%)]" />
        {/* Side Torchlight Warm Glows matching reference image */}
        <div className="absolute top-20 -left-20 h-96 w-96 rounded-full bg-amber-600/30 blur-[120px]" />
        <div className="absolute top-20 -right-20 h-96 w-96 rounded-full bg-amber-600/30 blur-[120px]" />
      </div>

      {/* Top Navigation Bar matching reference design */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#080C14]/90 backdrop-blur-xl px-4 sm:px-8 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          {/* Left: Brand Crest & Title */}
          <Link href="/protected" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--xp-border-gold)] bg-gradient-to-br from-[var(--xp-gold)]/20 via-[#0D1220] to-[#080C14] shadow-sm group-hover:border-[var(--xp-gold)] transition-colors">
              <Shield className="h-4 w-4 text-[var(--xp-gold)]" />
            </div>
            <span className="font-rpg text-base font-bold tracking-wider text-white">
              IRL <span className="text-[var(--xp-gold)]">XP</span>
            </span>
          </Link>

          {/* Center: Navigation Links with Active Gold Underline */}
          <nav className="hidden sm:flex items-center gap-7 md:gap-9">
            {TOP_NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/protected"
                  ? pathname === "/protected"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-[var(--xp-text-muted)] hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-3 left-0 right-0 h-[2px] bg-[var(--xp-gold)] shadow-[0_0_8px_var(--xp-gold)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Gold Counter Pill + Avatar + Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--xp-border-gold)]/60 bg-[var(--xp-gold)]/10 px-3 py-1 text-xs font-bold text-[var(--xp-gold)] shadow-sm">
              <span className="text-xs">🪙</span>
              <span>{displayGold.toLocaleString()} +</span>
            </div>

            {/* Avatar Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 overflow-hidden bg-white/10 hover:border-[var(--xp-gold)] transition-colors cursor-pointer"
              title="Edit Profile & Settings"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={player.avatarUrl || "/assets/character_portrait.jpg"}
                alt={player.name}
                className="h-full w-full object-cover"
              />
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 rounded-lg text-[var(--xp-text-muted)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Settings & Profile"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Body (Centered, Spacious Canvas) */}
      <div className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-xl border border-[var(--xp-ember)]/40 bg-[var(--xp-ember)]/10 px-4 py-3 text-xs font-medium text-[var(--xp-ember)] shadow-md"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss error"
              className="ml-3 text-sm opacity-70 hover:opacity-100 transition-opacity font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between rounded-xl border border-[var(--xp-vital)]/40 bg-[var(--xp-vital)]/10 px-4 py-3 text-xs font-medium text-[var(--xp-vital)] shadow-md"
          >
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={dismissSuccessMessage}
              aria-label="Dismiss message"
              className="ml-3 text-sm opacity-70 hover:opacity-100 transition-opacity font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <main className="flex flex-col gap-6">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden">
        <BottomNav />
      </div>

      {/* Level Up Overlay */}
      {levelUpTo !== null && (
        <LevelUpOverlay
          level={levelUpTo}
          oldLevel={levelUpOldLevel ?? undefined}
          onDismiss={dismissLevelUp}
        />
      )}

      {/* New Quest Modal */}
      <NewQuestModal
        isOpen={isNewQuestModalOpen}
        onClose={() => setIsNewQuestModalOpen(false)}
        onQuestCreated={handleQuestCreated}
      />

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={showSettingsModal || showProfileModal}
        onClose={() => {
          setShowSettingsModal(false);
          setShowProfileModal(false);
        }}
      />
    </div>
  );
}

export default ProtectedShell;
