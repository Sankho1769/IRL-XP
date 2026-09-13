// components/dashboard/SidebarNav.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ScrollText, User, Store, Settings, Shield, Sparkles, X } from "lucide-react";
import Image from "next/image";

export type DashboardTab = "home" | "story" | "quests" | "character" | "shop" | "settings";

export interface NavItem {
  key: DashboardTab;
  href: string;
  label: string;
  icon: typeof Home;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/protected", label: "Home", icon: Home },
  { key: "story", href: "/protected/story", label: "Story", icon: BookOpen },
  { key: "quests", href: "/protected/quests", label: "Quests", icon: ScrollText },
  { key: "character", href: "/protected/character", label: "Character", icon: User },
  { key: "shop", href: "/protected/shop", label: "Shop", icon: Store },
];

interface SidebarNavProps {
  active?: DashboardTab;
  onChange?: (tab: DashboardTab) => void;
}

export function SidebarNav({ active, onChange }: SidebarNavProps = {}) {
  const pathname = usePathname();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <>
      <nav
        aria-label="Main Navigation"
        className="xp-panel hidden h-fit w-60 shrink-0 flex-col gap-6 p-4 md:flex sticky top-6 z-20"
      >
        {/* Brand Header */}
        <div className="px-2 pt-1">
          <Link href="/protected" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--xp-border-gold)] bg-gradient-to-br from-[var(--xp-gold)]/20 via-[var(--xp-void-raised)] to-[var(--xp-panel)] shadow-md group-hover:border-[var(--xp-gold)] transition-colors">
              <Shield className="h-5 w-5 text-[var(--xp-gold)]" />
            </div>
            <div className="min-w-0">
              <p className="font-rpg text-lg font-bold tracking-wider text-[var(--xp-text)] leading-none group-hover:text-white transition-colors">
                IRL <span className="text-[var(--xp-gold)]">XP</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--xp-text-muted)] mt-1 font-medium">
                Level Up In Reality
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
            const isActive = active
              ? active === key
              : href === "/protected"
              ? pathname === "/protected"
              : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => onChange?.(key)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 text-[var(--xp-gold)] shadow-sm shadow-[var(--xp-gold)]/10"
                    : "border border-transparent text-[var(--xp-text-muted)] hover:bg-white/5 hover:text-[var(--xp-text)] hover:border-white/10"
                }`}
              >
                <Icon
                  className="h-4 w-4 shrink-0 transition-colors"
                  style={{
                    color: isActive ? "var(--xp-gold)" : "currentColor",
                  }}
                  aria-hidden="true"
                />
                <span className="font-medium">{label}</span>
                {isActive && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--xp-gold)] shadow-[0_0_8px_var(--xp-gold)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}

          {/* Settings Secondary Action */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide border border-transparent text-[var(--xp-text-faint)] hover:bg-white/5 hover:text-[var(--xp-text)] hover:border-white/10 transition-all text-left mt-1"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="font-medium">Settings</span>
          </button>
        </div>

        {/* Motivational Card at Bottom */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--xp-border)] bg-gradient-to-b from-[var(--xp-void-raised)] to-[var(--xp-panel)] p-3.5 shadow-inner">
          <div className="relative h-20 w-full overflow-hidden rounded-lg mb-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/grimoire_book.jpg"
              alt="Keep Going"
              className="h-full w-full object-cover object-center opacity-75 hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--xp-void)] via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--xp-gold)]">
              <Sparkles className="h-3 w-3" />
              <span>Keep Going</span>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--xp-text-muted)] italic font-serif">
            &ldquo;It&apos;s not about perfection, but progress.&rdquo;
          </p>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="xp-panel w-full max-w-md p-6 relative border border-[var(--xp-border-gold)]">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-[var(--xp-text-muted)] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-[var(--xp-gold)]" />
              <h3 className="font-rpg text-lg font-bold text-[var(--xp-text)]">Settings & Preferences</h3>
            </div>
            <div className="space-y-4 text-xs text-[var(--xp-text-muted)]">
              <div className="p-3 rounded-lg border border-[var(--xp-border)] bg-[var(--xp-void-raised)]">
                <span className="font-semibold text-[var(--xp-text)] block mb-1">Theme</span>
                <span>Dark RPG Cinematic (Active)</span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--xp-border)] bg-[var(--xp-void-raised)]">
                <span className="font-semibold text-[var(--xp-text)] block mb-1">Game Version</span>
                <span>IRL XP v1.0 • Hackathon Edition</span>
              </div>
              <p className="text-[11px] text-[var(--xp-text-faint)] italic">
                Audio effects, dynamic notifications, and cloud sync are automatically maintained by your guild.
              </p>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="xp-btn-gold w-full mt-5 py-2 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
