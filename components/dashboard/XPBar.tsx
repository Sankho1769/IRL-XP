// components/dashboard/XPBar.tsx
"use client";

interface XPBarProps {
  currentXP: number;
  xpToNextLevel: number;
  label?: string;
}

export function XPBar({ currentXP, xpToNextLevel, label }: XPBarProps) {
  const pct = Math.max(0, Math.min(100, (currentXP / xpToNextLevel) * 100));

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--xp-text-muted)]">
          <span>{label}</span>
          <span className="font-medium text-[var(--xp-text)]">
            {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
      )}
      <div
        className="xp-bar-track"
        role="progressbar"
        aria-valuenow={currentXP}
        aria-valuemin={0}
        aria-valuemax={xpToNextLevel}
        aria-label={label ?? "Experience progress"}
      >
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
