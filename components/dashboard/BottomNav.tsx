// components/dashboard/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ScrollText, User, Store } from "lucide-react";
import type { DashboardTab } from "./SidebarNav";

export interface BottomNavItem {
  key: DashboardTab;
  href: string;
  label: string;
  icon: typeof Home;
}

const ITEMS: BottomNavItem[] = [
  { key: "home", href: "/protected", label: "Home", icon: Home },
  { key: "story", href: "/protected/story", label: "Story", icon: BookOpen },
  { key: "quests", href: "/protected/quests", label: "Quests", icon: ScrollText },
  { key: "character", href: "/protected/character", label: "Character", icon: User },
  { key: "shop", href: "/protected/shop", label: "Shop", icon: Store },
];

interface BottomNavProps {
  active?: DashboardTab;
  onChange?: (tab: DashboardTab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps = {}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--xp-border)] bg-[#0D1322]/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ key, href, label, icon: Icon }) => {
          const isActive = active
            ? active === key
            : href === "/protected"
            ? pathname === "/protected"
            : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => onChange?.(key)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-[var(--xp-gold)]"
                    : "text-[var(--xp-text-muted)] hover:text-[var(--xp-text)]"
                }`}
              >
                <div className="relative">
                  <Icon
                    className="h-5 w-5 transition-transform active:scale-90"
                    style={{
                      color: isActive ? "var(--xp-gold)" : "currentColor",
                    }}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[var(--xp-gold)] shadow-[0_0_6px_var(--xp-gold)]" />
                  )}
                </div>
                <span
                  style={{
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
