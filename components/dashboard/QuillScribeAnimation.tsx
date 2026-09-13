// components/dashboard/QuillScribeAnimation.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook to track whether the user is actively typing in a text field,
 * automatically returning isTyping: true on keystrokes and debouncing to false.
 */
export function useQuillTyping(debounceMs = 800) {
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const registerTyping = useCallback(() => {
    setIsTyping(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isTyping, registerTyping };
}

interface QuillScribeAnimationProps {
  isTyping?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showInkDrops?: boolean;
  showLabel?: boolean;
  label?: string;
}

export function QuillScribeAnimation({
  isTyping = false,
  size = "md",
  className = "",
  showInkDrops = true,
  showLabel = false,
  label = "Scribing decree...",
}: QuillScribeAnimationProps) {
  // Dimensions based on size
  const dimensions = {
    xs: { w: 24, h: 24, scale: 0.6 },
    sm: { w: 32, h: 32, scale: 0.8 },
    md: { w: 42, h: 42, scale: 1 },
    lg: { w: 56, h: 56, scale: 1.3 },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <div
        className="relative"
        style={{ width: dimensions.w, height: dimensions.h }}
      >
        {/* Animated Quill Container */}
        <div
          className={`w-full h-full transition-transform duration-300 ${
            isTyping ? "animate-quill-scribe" : "animate-quill-float"
          }`}
        >
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          >
            <defs>
              {/* Gradient for Feather Vane */}
              <linearGradient id="quillFeatherGrad" x1="56" y1="4" x2="20" y2="46" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#F5E6CA" />
                <stop offset="60%" stopColor="#E5B869" />
                <stop offset="90%" stopColor="#8C6527" />
                <stop offset="100%" stopColor="#3A240A" />
              </linearGradient>

              {/* Gradient for Quill Shaft / Rachis */}
              <linearGradient id="quillShaftGrad" x1="58" y1="2" x2="12" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF2D6" />
                <stop offset="50%" stopColor="#E5B869" />
                <stop offset="100%" stopColor="#926C2A" />
              </linearGradient>

              {/* Metallic Nib Gradient */}
              <linearGradient id="quillNibGrad" x1="16" y1="48" x2="6" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFE8A3" />
                <stop offset="45%" stopColor="#E5B869" />
                <stop offset="75%" stopColor="#B38634" />
                <stop offset="100%" stopColor="#1A1207" />
              </linearGradient>
            </defs>

            {/* Feather Outer Silhouette with Barbs */}
            <path
              d="M58 3C58 3 50 8 44 14C39 12 34 16 32 19C30 18 26 21 24 25C21 24 18 28 17 31C16 34 18 36 21 37C19 39 18 42 19 44C20 46 23 47 25 46C23 48 24 51 27 50C31 49 33 46 36 43C40 38 45 32 50 25C55 18 58 10 58 3Z"
              fill="url(#quillFeatherGrad)"
              opacity="0.95"
            />

            {/* Inner Feather Shading Lines */}
            <path
              d="M48 11C43 17 38 23 33 30M42 18C38 23 34 29 30 35M37 24C33 29 30 34 27 39M32 30C29 34 26 39 23 43"
              stroke="#6B4B1B"
              strokeWidth="0.75"
              strokeLinecap="round"
              opacity="0.4"
            />

            {/* Feather Left Side Barbs */}
            <path
              d="M57 4C52 10 42 22 36 30C32 35 28 40 24 46C23 44 24 41 26 40C24 38 26 35 28 34C26 32 29 29 31 28C30 25 34 22 36 21C35 18 40 14 43 13C45 10 52 5 57 4Z"
              fill="#FFFFFF"
              fillOpacity="0.25"
            />

            {/* Central Quill Spine / Shaft (Rachis) */}
            <path
              d="M59 2C52 12 38 32 20 48L15 53"
              stroke="url(#quillShaftGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M58 3C51 13 38 32 20 48"
              stroke="#FFF"
              strokeWidth="0.75"
              strokeLinecap="round"
              opacity="0.7"
            />

            {/* Ornate Gold Ferrule / Collar */}
            <path
              d="M19 47L14 52C13 53 14 54 15 55L17 55C18 55 19 54 20 53L23 49C22 48 20 47 19 47Z"
              fill="#E5B869"
              stroke="#8C6527"
              strokeWidth="0.6"
            />

            {/* Precision Metal Scribing Nib */}
            <path
              d="M15 52L8 59C7.5 59.5 7 60.5 6.5 61.5L6 62.5L7 62C8 61.5 9 61 9.5 60.5L16 54L15 52Z"
              fill="url(#quillNibGrad)"
              stroke="#5C4018"
              strokeWidth="0.5"
            />

            {/* Nib Ink Breathing Hole & Slit */}
            <circle cx="11" cy="56.5" r="0.75" fill="#1A1207" />
            <line x1="11" y1="56.5" x2="6" y2="62.5" stroke="#1A1207" strokeWidth="0.5" />

            {/* Golden Nib Highlight */}
            <path
              d="M14 53L8.5 59"
              stroke="#FFF2D6"
              strokeWidth="0.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* Animated Ink Droplets from Nib Tip */}
        {showInkDrops && isTyping && (
          <>
            {/* Primary Droplet */}
            <span
              className="absolute left-[5px] bottom-[1px] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-amber-400 to-[#2A1B0D] animate-ink-drop pointer-events-none"
              style={{ animationDelay: "0ms" }}
            />
            {/* Secondary Droplet */}
            <span
              className="absolute left-[3px] bottom-[-2px] h-1 w-1 rounded-full bg-amber-500 animate-ink-drop pointer-events-none"
              style={{ animationDelay: "220ms" }}
            />
            {/* Nib Glow Spot */}
            <span
              className="absolute left-[2px] bottom-[2px] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/30 blur-xs pointer-events-none animate-pulse"
            />
            {/* Magic Scribing Dust / Sparkles */}
            <span
              className="absolute left-[4px] bottom-[6px] text-[10px] text-amber-300 animate-quill-sparkle pointer-events-none"
              style={{ animationDelay: "100ms" }}
            >
              ✦
            </span>
            <span
              className="absolute left-[1px] bottom-[10px] text-[8px] text-amber-200 animate-quill-sparkle pointer-events-none"
              style={{ animationDelay: "350ms" }}
            >
              ✧
            </span>
          </>
        )}
      </div>

      {/* Optional Scribing Status Badge */}
      {showLabel && isTyping && (
        <span className="text-[10px] font-bold text-amber-300/90 font-serif italic tracking-wide animate-pulse truncate drop-shadow-sm flex items-center gap-1">
          <span>{label}</span>
        </span>
      )}
    </div>
  );
}

export default QuillScribeAnimation;
