// components/ui/IRLXPPageLoader.tsx
"use client";

import React from "react";
import { IRLXPLoader } from "./IRLXPLoader";

export interface IRLXPPageLoaderProps {
  initialMessage?: string;
  messages?: string[];
  fullScreen?: boolean;
  className?: string;
}

export function IRLXPPageLoader({
  initialMessage = "Preparing your adventure...",
  messages,
  fullScreen = true,
  className = "",
}: IRLXPPageLoaderProps) {
  const containerStyle = fullScreen
    ? "fixed inset-0 z-50 min-h-screen w-full bg-[#080C14]"
    : "relative min-h-[50vh] w-full bg-[#080C14]/90 rounded-2xl";

  return (
    <div
      className={`xp-scope flex flex-col items-center justify-center p-6 overflow-hidden ${containerStyle} ${className}`}
    >
      {/* Cinematic RPG Atmosphere Background Gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(19, 29, 49, 0.9) 0%, rgba(8, 12, 20, 0.98) 70%, #080C14 100%)",
        }}
      />

      {/* Subtle Warm Gold Center Bloom */}
      <div
        className="absolute h-96 w-96 rounded-full bg-[var(--xp-gold)]/[0.04] blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Foreground Content */}
      <div className="relative z-10">
        <IRLXPLoader
          initialMessage={initialMessage}
          messages={messages}
          size="md"
        />
      </div>
    </div>
  );
}
