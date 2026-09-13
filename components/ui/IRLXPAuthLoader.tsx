// components/ui/IRLXPAuthLoader.tsx
"use client";

import React from "react";
import { Shield } from "lucide-react";

export interface IRLXPAuthLoaderProps {
  message?: string;
  className?: string;
}

export function IRLXPAuthLoader({
  message = "Preparing your journey...",
  className = "",
}: IRLXPAuthLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#080C14] select-none ${className}`}
    >
      {/* Screen-reader accessible label */}
      <span className="sr-only">{message}</span>

      {/* Cinematic RPG Atmosphere Background Gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(19, 29, 49, 0.95) 0%, rgba(8, 12, 20, 0.98) 70%, #080C14 100%)",
        }}
      />

      {/* Warm Gold Radial Glow Bloom */}
      <div
        className="absolute h-80 w-80 rounded-full bg-[var(--xp-gold)]/[0.08] blur-3xl pointer-events-none animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "3s" }}
      />

      {/* Floating Ambient Embers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <span
          className="xp-loader-particle absolute top-1/3 left-1/4 h-1.5 w-1.5 rounded-full bg-[#F5C362]/70 blur-[0.5px]"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="xp-loader-particle absolute bottom-1/3 right-1/4 h-2 w-2 rounded-full bg-[#E5B869]/60 blur-[0.5px]"
          style={{ animationDelay: "1400ms" }}
        />
        <span
          className="xp-loader-particle absolute top-1/2 right-1/3 h-1 w-1 rounded-full bg-[#F97316]/80"
          style={{ animationDelay: "800ms" }}
        />
        <span
          className="xp-loader-particle absolute bottom-1/2 left-1/3 h-1.5 w-1.5 rounded-full bg-[#F5C362]/50"
          style={{ animationDelay: "2200ms" }}
        />
      </div>

      {/* Main Assembly */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Crest & Rotating Concentric Rings */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Boundary Halo */}
          <div className="absolute h-36 w-36 rounded-full border border-[var(--xp-gold)]/15 pointer-events-none" />

          {/* SVG Rotating Rings */}
          <svg
            className="h-32 w-32 text-[var(--xp-gold)] pointer-events-none"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Outer Dashed Rotating Ring (Clockwise) */}
            <g className="xp-loader-ring-slow">
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="rgba(229, 184, 105, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="6 10 20 10"
                strokeLinecap="round"
              />
              {/* Cardinal Accent Jewels */}
              <circle cx="60" cy="8" r="2" fill="var(--xp-gold)" />
              <circle cx="112" cy="60" r="2" fill="var(--xp-gold)" />
              <circle cx="60" cy="112" r="2" fill="var(--xp-gold)" />
              <circle cx="8" cy="60" r="2" fill="var(--xp-gold)" />
            </g>

            {/* Inner Counter-Rotating Orbit Ring (Counter-Clockwise) */}
            <g className="xp-loader-ring-reverse">
              <circle
                cx="60"
                cy="60"
                r="42"
                stroke="rgba(229, 184, 105, 0.25)"
                strokeWidth="1"
                strokeDasharray="4 16"
                strokeLinecap="round"
              />
            </g>
          </svg>

          {/* Brand Shield Icon in Center */}
          <div className="absolute flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--xp-border-gold)] bg-gradient-to-br from-[var(--xp-gold)]/20 via-[#0D1322] to-[#080C14] shadow-lg shadow-[var(--xp-gold)]/15">
            <Shield className="h-7 w-7 text-[var(--xp-gold)] animate-pulse" style={{ animationDuration: "2s" }} />
          </div>
        </div>

        {/* Brand Title: IRL XP */}
        <div className="mt-5 flex items-center gap-2" aria-hidden="true">
          <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[var(--xp-gold)]/50" />
          <h2 className="font-rpg text-base sm:text-lg font-bold tracking-[0.25em] text-[var(--xp-text)] uppercase drop-shadow-[0_2px_8px_rgba(229,184,105,0.3)]">
            IRL <span className="text-[var(--xp-gold)]">XP</span>
          </h2>
          <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[var(--xp-gold)]/50" />
        </div>

        {/* Animated Status Text */}
        <div className="mt-3 flex items-center gap-2 text-center px-4">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--xp-gold)] animate-ping" />
          <p className="text-xs sm:text-sm text-[var(--xp-text-muted)] font-serif italic tracking-wide">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default IRLXPAuthLoader;
