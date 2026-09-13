// components/dashboard/AttributeBar.tsx
"use client";

import type { LucideIcon } from "lucide-react";
import type { AttributeKey } from "@/types/dashboard";

interface AttributeBarProps {
  attrKey: AttributeKey;
  label: string;
  value: number; // 0-100
  icon: LucideIcon;
}

export function AttributeBar({ attrKey, label, value, icon: Icon }: AttributeBarProps) {
  // Attribute values are unbounded counts from the database; the bar
  // visually caps at 100 so it never overflows, but the real number
  // is always shown next to the label.
  const widthPct = Math.max(0, Math.min(100, value));

  return (
    <div className={`xp-cat-${attrKey}`}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[var(--xp-text-muted)]">
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--cat)" }} aria-hidden="true" />
          {label}
        </span>
        <span className="font-medium text-[var(--xp-text)]">{value}</span>
      </div>
      <div
        className="xp-attr-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="xp-attr-fill" style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
