// components/ui/IRLXPLoader.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";

const DEFAULT_MESSAGES = [
  "Preparing your next quest...",
  "Consulting the chronicle...",
  "Forging your adventure...",
  "Loading your character...",
  "Opening the quest log...",
];

export interface IRLXPLoaderProps {
  initialMessage?: string;
  messages?: string[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function IRLXPLoader({
  initialMessage,
  messages = DEFAULT_MESSAGES,
  className = "",
  size = "md",
}: IRLXPLoaderProps) {
  const activeMessages = useMemo(
    () =>
      initialMessage
        ? [initialMessage, ...messages.filter((m) => m !== initialMessage)]
        : messages,
    [initialMessage, messages]
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (activeMessages.length <= 1) return;

    let fadeTimeout: NodeJS.Timeout | null = null;

    const interval = setInterval(() => {
      setIsFading(true);
      fadeTimeout = setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % activeMessages.length);
        setIsFading(false);
      }, 300);
    }, 3600);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [activeMessages]);

  const currentMessage = activeMessages[messageIndex] ?? activeMessages[0];

  const scaleClasses = {
    sm: "scale-75",
    md: "scale-100",
    lg: "scale-125",
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading IRL XP"
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Screen-reader accessible announcement */}
      <span className="sr-only">Loading IRL XP: {currentMessage}</span>

      {/* Emblem & Rings Assembly */}
      <div className={`relative flex items-center justify-center ${scaleClasses}`}>
        {/* Soft Background Radial Gold Glow */}
        <div
          className="absolute h-32 w-32 rounded-full bg-[var(--xp-gold)]/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Floating Ambient Embers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span
            className="xp-loader-particle absolute top-2 left-6 h-1 w-1 rounded-full bg-[#F5C362]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="xp-loader-particle absolute bottom-3 right-6 h-1.5 w-1.5 rounded-full bg-[#E5B869]"
            style={{ animationDelay: "1200ms" }}
          />
          <span
            className="xp-loader-particle absolute top-8 right-3 h-1 w-1 rounded-full bg-[#F97316]/70"
            style={{ animationDelay: "2400ms" }}
          />
          <span
            className="xp-loader-particle absolute bottom-8 left-3 h-1 w-1 rounded-full bg-[#F5C362]/60"
            style={{ animationDelay: "1800ms" }}
          />
        </div>

        {/* SVG Crest and Concentric Rotating Rings */}
        <svg
          className="h-28 w-28 text-[var(--xp-gold)]"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle Outer Boundary Halo */}
          <circle
            cx="60"
            cy="60"
            r="56"
            stroke="rgba(229, 184, 105, 0.12)"
            strokeWidth="1"
          />

          {/* Outer Dashed Rotating Ring (Clockwise) */}
          <g className="xp-loader-ring-slow">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="rgba(229, 184, 105, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="6 8 18 8"
              strokeLinecap="round"
            />
            {/* Cardinal Accent Pointers on the ring */}
            <circle cx="60" cy="10" r="1.5" fill="var(--xp-gold)" />
            <circle cx="110" cy="60" r="1.5" fill="var(--xp-gold)" />
            <circle cx="60" cy="110" r="1.5" fill="var(--xp-gold)" />
            <circle cx="10" cy="60" r="1.5" fill="var(--xp-gold)" />
          </g>

          {/* Inner Counter-Rotating Orbit Ring (Counter-Clockwise) */}
          <g className="xp-loader-ring-reverse">
            <circle
              cx="60"
              cy="60"
              r="40"
              stroke="rgba(229, 184, 105, 0.25)"
              strokeWidth="1"
              strokeDasharray="3 14"
              strokeLinecap="round"
            />
          </g>

          {/* Central Pulsing Geometric RPG Emblem */}
          <g className="xp-loader-crest-glow">
            {/* Soft inner fill glow diamond */}
            <polygon
              points="60,28 76,60 60,92 44,60"
              fill="rgba(229, 184, 105, 0.08)"
              stroke="rgba(229, 184, 105, 0.5)"
              strokeWidth="1.2"
            />
            {/* Inner radiant diamond */}
            <polygon
              points="60,36 70,60 60,84 50,60"
              stroke="var(--xp-gold)"
              strokeWidth="1.5"
            />
            {/* Central 4-pointed radiant star rune */}
            <path
              d="M60 46 C60 55 64 60 74 60 C64 60 60 65 60 74 C60 65 56 60 46 60 C56 60 60 55 60 46 Z"
              fill="var(--xp-gold)"
            />
            {/* Micro center jewel */}
            <circle cx="60" cy="60" r="2" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* Brand Title: IRL XP */}
      <div className="mt-4 flex items-center gap-2" aria-hidden="true">
        <span className="h-[1px] w-5 bg-gradient-to-r from-transparent to-[var(--xp-gold)]/40" />
        <h3 className="font-rpg text-sm sm:text-base font-bold tracking-[0.25em] text-[var(--xp-text)] uppercase drop-shadow-[0_2px_8px_rgba(229,184,105,0.25)]">
          IRL XP
        </h3>
        <span className="h-[1px] w-5 bg-gradient-to-l from-transparent to-[var(--xp-gold)]/40" />
      </div>

      {/* Dynamic Rotating RPG Message */}
      <div className="mt-2 min-h-[1.5rem] flex items-center justify-center px-4 text-center">
        <p
          className={`text-xs sm:text-sm text-[var(--xp-text-muted)] font-serif italic transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-90"
          }`}
        >
          {currentMessage}
        </p>
      </div>
    </div>
  );
}
