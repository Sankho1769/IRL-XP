// lib/hooks/useAnimatedNumber.ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(targetValue: number, durationMs = 800): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const currentValRef = useRef(targetValue);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || targetValue === currentValRef.current) {
      currentValRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    const startValue = currentValRef.current;
    const diff = targetValue - startValue;
    const startTime = performance.now();

    // Cancel any in-flight animation frame
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startValue + diff * ease);

      currentValRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        currentValRef.current = targetValue;
        setDisplayValue(targetValue);
        animFrameRef.current = null;
      }
    }

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [targetValue, durationMs]);

  return displayValue;
}
