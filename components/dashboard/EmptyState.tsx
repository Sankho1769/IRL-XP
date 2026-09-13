// components/dashboard/EmptyState.tsx
"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="xp-panel-flat flex flex-col items-center gap-3 px-6 py-10 text-center border border-white/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--xp-border-gold)]/40 bg-[var(--xp-gold)]/10">
        <Icon className="h-6 w-6 text-[var(--xp-gold)]" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <h3 className="font-rpg text-base font-bold text-[var(--xp-text)]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--xp-text-muted)] font-serif italic">
          {description}
        </p>
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="xp-btn-gold mt-2 px-4 py-2 text-xs font-bold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
