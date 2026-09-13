// app/protected/focus/page.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle2,
  Clock,
  Timer,
  Flame,
  Target,
  Sparkles,
  ChevronDown,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import type { Quest } from "@/types/dashboard";

type FocusModeType = "countdown" | "stopwatch";
type TimerState = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";

const COUNTDOWN_PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "25 min", minutes: 25 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
  { label: "Custom", minutes: -1 },
];

function formatTime(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function FocusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuestId = searchParams.get("questId");

  const {
    presentationQuests,
    handleQuestComplete,
    completedQuestIds,
    pendingQuestId,
  } = useDashboard();

  // Selected quest
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(initialQuestId);

  // Lightweight clock state for presentation-only deadline comparisons
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Active focus targets exclude completed and expired quests
  const activeQuests = useMemo(
    () =>
      presentationQuests.filter(
        (q) =>
          !completedQuestIds.has(q.id) &&
          (!q.deadlineAt || new Date(q.deadlineAt).getTime() > now)
      ),
    [presentationQuests, completedQuestIds, now]
  );

  const quest = useMemo(
    () => presentationQuests.find((q) => q.id === selectedQuestId) ?? null,
    [presentationQuests, selectedQuestId]
  );

  const isQuestAlreadyDone = quest ? completedQuestIds.has(quest.id) : false;
  const isQuestExpired = useMemo(() => {
    if (!quest || !quest.deadlineAt) return false;
    return new Date(quest.deadlineAt).getTime() <= now;
  }, [quest, now]);

  // Mode: countdown vs stopwatch
  const [mode, setMode] = useState<FocusModeType>("countdown");
  const [timerState, setTimerState] = useState<TimerState>("IDLE");

  // Countdown settings
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);

  const isCustomDurationInvalid =
    mode === "countdown" &&
    selectedPreset === -1 &&
    customHours === 0 &&
    customMinutes === 0;

  // Timestamp references
  const targetEndTimestampRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const accumulatedElapsedMsRef = useRef<number>(0);

  // Display timers
  const [remainingMs, setRemainingMs] = useState<number>(25 * 60 * 1000);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // Session tracking (in-memory / temporary display only)
  const [lastSessionMin, setLastSessionMin] = useState<number | null>(null);
  const [totalTodayMin, setTotalTodayMin] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      return Number(sessionStorage.getItem("irl_xp_focus_today_min") || 0);
    } catch {
      return 0;
    }
  });

  // Sound toggle (OFF by default)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Mark complete prompt action state
  const [questMarkedComplete, setQuestMarkedComplete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Compute active countdown duration
  const activeCountdownDurationMs = useMemo(() => {
    if (selectedPreset === -1) {
      return (customHours * 3600 + customMinutes * 60) * 1000;
    }
    return selectedPreset * 60 * 1000;
  }, [selectedPreset, customHours, customMinutes]);

  // When preset or mode changes while IDLE, reset remaining
  useEffect(() => {
    if (timerState === "IDLE") {
      setRemainingMs(activeCountdownDurationMs);
    }
  }, [activeCountdownDurationMs, timerState]);

  // Tick loop
  useEffect(() => {
    if (timerState !== "RUNNING") return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (mode === "countdown") {
        if (targetEndTimestampRef.current === null) return;
        const left = targetEndTimestampRef.current - now;

        if (left <= 0) {
          setRemainingMs(0);
          setTimerState("COMPLETED");
          targetEndTimestampRef.current = null;
          recordCompletedSession(activeCountdownDurationMs);
        } else {
          setRemainingMs(left);
        }
      } else {
        // Stopwatch
        if (startTimestampRef.current === null) return;
        const total = accumulatedElapsedMsRef.current + (now - startTimestampRef.current);
        setElapsedMs(total);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerState, mode, activeCountdownDurationMs]);

  function recordCompletedSession(durationMs: number) {
    const mins = Math.max(1, Math.round(durationMs / 60000));
    setLastSessionMin(mins);
    setTotalTodayMin((prev) => {
      const next = prev + mins;
      try {
        sessionStorage.setItem("irl_xp_focus_today_min", String(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (soundEnabled) {
      try {
        // Gentle RPG chime via Web Audio API
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } catch {
        // ignore audio errors
      }
    }
  }

  // Timer controls
  function handleStart() {
    if (mode === "countdown") {
      if (activeCountdownDurationMs < 60 * 1000) return;
      targetEndTimestampRef.current = Date.now() + remainingMs;
    } else {
      startTimestampRef.current = Date.now();
    }
    setTimerState("RUNNING");
  }

  function handlePause() {
    if (mode === "countdown") {
      if (targetEndTimestampRef.current) {
        const left = Math.max(0, targetEndTimestampRef.current - Date.now());
        setRemainingMs(left);
        targetEndTimestampRef.current = null;
      }
    } else {
      if (startTimestampRef.current) {
        accumulatedElapsedMsRef.current += Date.now() - startTimestampRef.current;
        startTimestampRef.current = null;
        setElapsedMs(accumulatedElapsedMsRef.current);
      }
    }
    setTimerState("PAUSED");
  }

  function handleResume() {
    if (mode === "countdown") {
      targetEndTimestampRef.current = Date.now() + remainingMs;
    } else {
      startTimestampRef.current = Date.now();
    }
    setTimerState("RUNNING");
  }

  function handleReset() {
    targetEndTimestampRef.current = null;
    startTimestampRef.current = null;
    accumulatedElapsedMsRef.current = 0;

    if (mode === "countdown") {
      setRemainingMs(activeCountdownDurationMs);
    } else {
      setElapsedMs(0);
    }
    setTimerState("IDLE");
    setQuestMarkedComplete(false);
  }

  function handleStopwatchStop() {
    if (startTimestampRef.current) {
      accumulatedElapsedMsRef.current += Date.now() - startTimestampRef.current;
      startTimestampRef.current = null;
    }
    setElapsedMs(accumulatedElapsedMsRef.current);
    setTimerState("COMPLETED");
    recordCompletedSession(accumulatedElapsedMsRef.current);
  }

  async function handleMarkQuestDone() {
    if (!quest || isQuestAlreadyDone || isQuestExpired || isCompleting) return;
    setIsCompleting(true);
    try {
      const success = await handleQuestComplete(quest);
      if (success) {
        setQuestMarkedComplete(true);
      }
    } finally {
      setIsCompleting(false);
    }
  }

  const isBoss = quest?.questType === "boss";

  return (
    <div className="relative flex min-h-screen h-dvh flex-col justify-between p-4 sm:p-8 bg-[#080C14] text-[var(--xp-text)] select-none overflow-hidden">
      {/* Immersive Focus Chamber Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isBoss ? "/assets/forge_blacksmith.jpg" : "/assets/quest_realm_bg.jpg"}
          alt=""
          className="h-full w-full object-cover object-center opacity-45 filter brightness-90 contrast-120 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080C14]/85 via-[#080C14]/65 to-[#080C14]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#080C14_85%)]" />
        {/* Warm ambient center glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[140px] pointer-events-none ${
            isBoss ? "bg-red-600/20" : "bg-amber-500/15"
          }`}
        />
      </div>

      {/* Top Header: Exit Button + Sound Toggle */}
      <header className="relative z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/protected")}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0E1526] px-3.5 py-2 text-xs font-semibold text-[var(--xp-text-muted)] hover:text-white hover:border-white/20 transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--xp-gold)]"
          aria-label="Exit Focus Chamber"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Focus</span>
        </button>

        {/* Temporary session stats pill */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--xp-text-muted)] font-medium">
          {lastSessionMin !== null && (
            <span>
              Last session: <strong className="text-[var(--xp-gold)]">{lastSessionMin}m</strong>
            </span>
          )}
          <span>
            Session Total: <strong className="text-white">{totalTodayMin}m</strong>
          </span>
        </div>

        {/* Audio Toggle (Off by default) */}
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-colors cursor-pointer ${
            soundEnabled
              ? "border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)]"
              : "border-white/10 bg-[#0E1526] text-[var(--xp-text-faint)] hover:text-[var(--xp-text-muted)]"
          }`}
          title={soundEnabled ? "Chime enabled" : "Sound muted (default)"}
          aria-label={soundEnabled ? "Sound enabled" : "Sound muted"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </header>

      {/* Main Focus Chamber Centerpiece */}
      {quest && isQuestAlreadyDone ? (
        <main className="relative z-10 flex flex-col items-center justify-center my-auto py-6 max-w-md mx-auto w-full text-center">
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0E1526] p-8 shadow-2xl animate-in zoom-in-95 w-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              QUEST COMPLETED
            </span>
            <h2 className="font-rpg text-xl sm:text-2xl font-bold text-white mt-2 mb-2">
              {quest.title}
            </h2>
            <p className="text-xs text-[var(--xp-text-muted)] font-serif italic mb-6">
              This quest has already been completed.
            </p>
            <button
              type="button"
              onClick={() => router.push("/protected/quests")}
              className="xp-btn-gold px-6 py-2.5 text-xs font-bold w-full cursor-pointer"
            >
              Back to Quests
            </button>
          </div>
        </main>
      ) : quest && isQuestExpired && timerState === "IDLE" ? (
        <main className="flex flex-col items-center justify-center my-auto py-6 max-w-md mx-auto w-full text-center">
          <div className="rounded-2xl border border-red-500/30 bg-[#0E1526] p-8 shadow-2xl animate-in zoom-in-95 w-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mx-auto mb-4 border border-red-500/30">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">
              QUEST EXPIRED
            </span>
            <h2 className="font-rpg text-xl sm:text-2xl font-bold text-white mt-2 mb-2">
              {quest.title}
            </h2>
            <p className="text-xs text-[var(--xp-text-muted)] font-serif italic mb-6">
              This quest can no longer be completed.
            </p>
            <button
              type="button"
              onClick={() => router.push("/protected/quests")}
              className="xp-btn-gold px-6 py-2.5 text-xs font-bold w-full cursor-pointer"
            >
              Back to Quests
            </button>
          </div>
        </main>
      ) : (
        <main className="relative z-10 flex flex-col items-center justify-center my-auto py-6 max-w-2xl mx-auto w-full text-center">
        {/* Focusing On Badge & Quest Title */}
        <div className="mb-6 flex flex-col items-center">
          {quest ? (
            <div className="flex flex-col items-center">
              {isQuestExpired ? (
                <div className="flex flex-col items-center gap-1 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-950/60 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-red-400 animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    ⚠ QUEST EXPIRED
                  </span>
                  <span className="text-[11px] font-semibold text-red-300">
                    Deadline passed. Session can continue, but quest cannot be completed.
                  </span>
                </div>
              ) : isBoss ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-red-400 animate-pulse mb-2">
                  <Flame className="h-3.5 w-3.5 text-red-400" />
                  Focusing on Boss
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-gold)] mb-2">
                  <Target className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
                  Focusing on Quest
                </span>
              )}

              <h2
                className={`font-rpg text-xl sm:text-3xl font-bold tracking-wide max-w-xl ${
                  isQuestExpired
                    ? "text-red-200"
                    : isBoss
                    ? "text-red-100"
                    : "text-white"
                }`}
              >
                {quest.title}
              </h2>

              {quest.description && (
                <p className="text-xs text-[var(--xp-text-muted)] mt-1.5 max-w-md line-clamp-2 font-serif italic">
                  &ldquo;{quest.description}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0E1526] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--xp-text-muted)] mb-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--xp-gold)]" />
                General Focus Chamber
              </span>
              <h2 className="font-rpg text-xl sm:text-3xl font-bold tracking-wide text-white">
                Deep Work Session
              </h2>

              {/* Optional Active Quest Picker */}
              {activeQuests.length > 0 && timerState === "IDLE" && (
                <div className="mt-3 relative">
                  <select
                    value={selectedQuestId ?? ""}
                    onChange={(e) => setSelectedQuestId(e.target.value || null)}
                    className="appearance-none rounded-xl border border-white/10 bg-[#0E1526] pl-3 pr-8 py-1.5 text-xs text-[var(--xp-gold)] font-semibold focus:border-[var(--xp-gold)] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Link to an active quest (optional) --</option>
                    {activeQuests.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.questType === "boss" ? `⚔ [BOSS] ${q.title}` : q.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--xp-text-faint)]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mode Selector Tabs (Countdown vs Stopwatch) */}
        {timerState === "IDLE" && (
          <div className="inline-flex rounded-xl border border-white/10 bg-[#0E1526] p-1 mb-6 shadow-md">
            <button
              type="button"
              onClick={() => {
                setMode("countdown");
                setRemainingMs(activeCountdownDurationMs);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                mode === "countdown"
                  ? "bg-[var(--xp-gold)] text-[#080C14] shadow-sm"
                  : "text-[var(--xp-text-muted)] hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Countdown</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("stopwatch");
                setElapsedMs(0);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                mode === "stopwatch"
                  ? "bg-[var(--xp-gold)] text-[#080C14] shadow-sm"
                  : "text-[var(--xp-text-muted)] hover:text-white"
              }`}
            >
              <Timer className="h-3.5 w-3.5" />
              <span>Stopwatch</span>
            </button>
          </div>
        )}

        {/* Countdown Presets Strip (Only when Countdown + IDLE) */}
        {mode === "countdown" && timerState === "IDLE" && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {COUNTDOWN_PRESETS.map(({ label, minutes }) => {
              const isSelected = selectedPreset === minutes;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedPreset(minutes)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "border-[var(--xp-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)] shadow-sm"
                      : "border-white/10 bg-[#0E1526] text-[var(--xp-text-muted)] hover:text-white hover:border-white/20"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Duration Inputs */}
        {mode === "countdown" && selectedPreset === -1 && timerState === "IDLE" && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl border border-white/10 bg-[#0E1526]">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
                  className="w-14 rounded-lg border border-white/15 bg-[#080C14] px-2 py-1 text-center text-sm font-bold text-white focus:border-[var(--xp-gold)] focus:outline-none"
                />
                <span className="text-xs text-[var(--xp-text-muted)] font-medium">hr</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                  className="w-14 rounded-lg border border-white/15 bg-[#080C14] px-2 py-1 text-center text-sm font-bold text-white focus:border-[var(--xp-gold)] focus:outline-none"
                />
                <span className="text-xs text-[var(--xp-text-muted)] font-medium">min</span>
              </div>
            </div>
            {isCustomDurationInvalid && (
              <p className="text-[11px] text-amber-400 font-medium">
                Custom duration must be at least 1 minute.
              </p>
            )}
          </div>
        )}

        {/* Massive Centered Timer Display */}
        <div className="relative flex flex-col items-center justify-center my-2 sm:my-4">
          {/* Subtle Ambient Radial Glow */}
          <div
            className={`absolute h-64 w-64 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
              timerState === "RUNNING"
                ? isBoss
                  ? "bg-red-600/15"
                  : "bg-[var(--xp-gold)]/15"
                : timerState === "COMPLETED"
                ? "bg-emerald-500/20"
                : "bg-transparent"
            }`}
          />

          {/* Status Badge */}
          <div className="mb-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${
                timerState === "RUNNING"
                  ? isBoss
                    ? "border border-red-500/50 bg-red-950/40 text-red-400 animate-pulse"
                    : "border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 text-[var(--xp-gold)] animate-pulse"
                  : timerState === "PAUSED"
                  ? "border border-amber-500/40 bg-amber-950/40 text-amber-300"
                  : timerState === "COMPLETED"
                  ? "border border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : "border border-white/10 bg-white/5 text-[var(--xp-text-faint)]"
              }`}
            >
              {timerState === "RUNNING"
                ? "FOCUSING"
                : timerState === "PAUSED"
                ? "PAUSED"
                : timerState === "COMPLETED"
                ? "FOCUS COMPLETE"
                : "READY"}
            </span>
          </div>

          {/* Digits Display */}
          <div
            className={`font-rpg font-extrabold tabular-nums tracking-tight leading-none transition-colors ${
              timerState === "COMPLETED"
                ? "text-emerald-400"
                : timerState === "RUNNING"
                ? isBoss
                  ? "text-red-100"
                  : "text-white"
                : timerState === "PAUSED"
                ? "text-amber-200"
                : "text-[var(--xp-text)]"
            } text-6xl sm:text-8xl md:text-9xl`}
          >
            {mode === "countdown" ? formatTime(remainingMs) : formatTime(elapsedMs)}
          </div>

          {timerState === "COMPLETED" && (
            <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-emerald-400 font-rpg tracking-wide animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>🎯 Session Complete!</span>
            </div>
          )}
        </div>

        {/* Primary Timer Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {timerState === "IDLE" && (
            <button
              type="button"
              onClick={handleStart}
              disabled={isCustomDurationInvalid}
              className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-xl transition-all ${
                isCustomDurationInvalid
                  ? "opacity-50 cursor-not-allowed bg-white/10 text-[var(--xp-text-muted)]"
                  : isBoss
                  ? "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-700/30 cursor-pointer active:scale-95"
                  : "xp-btn-gold cursor-pointer active:scale-95"
              }`}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{mode === "countdown" ? "Start Focus" : "Start Stopwatch"}</span>
            </button>
          )}

          {timerState === "RUNNING" && (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0E1526] hover:bg-[#151f38] px-6 py-3 text-sm font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </button>

              {mode === "stopwatch" ? (
                <button
                  type="button"
                  onClick={handleStopwatchStop}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 px-6 py-3 text-sm font-bold text-red-300 transition-all cursor-pointer active:scale-95"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0E1526] hover:bg-white/10 px-5 py-3 text-xs font-semibold text-[var(--xp-text-muted)] transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </>
          )}

          {timerState === "PAUSED" && (
            <>
              <button
                type="button"
                onClick={handleResume}
                className={`flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-bold shadow-lg transition-all cursor-pointer active:scale-95 ${
                  isBoss
                    ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-700/30"
                    : "xp-btn-gold"
                }`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Resume</span>
              </button>

              {mode === "stopwatch" && (
                <button
                  type="button"
                  onClick={handleStopwatchStop}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 px-6 py-3 text-sm font-bold text-red-300 transition-all cursor-pointer active:scale-95"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Stop</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0E1526] hover:bg-white/10 px-5 py-3 text-xs font-semibold text-[var(--xp-text-muted)] transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </>
          )}

          {timerState === "COMPLETED" && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#0E1526] hover:bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Start Another Session</span>
            </button>
          )}
        </div>

        {/* Post-Session Quest Completion Prompt (Explicit Complete Quest Flow) */}
        {timerState === "COMPLETED" && quest && (
          <div className="mt-8 w-full rounded-2xl border border-[var(--xp-border-gold)] bg-gradient-to-b from-[#111827] to-[#080C14] p-5 sm:p-6 shadow-2xl text-left animate-in zoom-in-95 duration-200">
            <h3 className="font-rpg text-base sm:text-lg font-bold text-white mb-1">
              Ready to mark this quest complete?
            </h3>
            <p className="text-xs text-[var(--xp-text-muted)] font-serif italic mb-4">
              Timer completed. Mark this quest as accomplished in the realm records to receive your XP and Gold rewards.
            </p>

            {questMarkedComplete || isQuestAlreadyDone ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Quest successfully completed in realm chronicles!</span>
              </div>
            ) : isQuestExpired ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs font-semibold text-red-400">
                  <Clock className="h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <span className="font-bold text-red-300">QUEST EXPIRED</span>
                    <p className="text-[11px] text-red-400/80 font-serif italic mt-0.5">
                      This quest&apos;s deadline has passed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/protected/quests")}
                  className="xp-btn-gold px-5 py-2.5 text-xs font-bold w-fit cursor-pointer"
                >
                  Back to Quests
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleMarkQuestDone}
                  disabled={isCompleting || pendingQuestId === quest.id}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50 ${
                    isBoss
                      ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-700/30"
                      : "xp-btn-gold"
                  }`}
                >
                  {isCompleting || pendingQuestId === quest.id ? (
                    <>
                      <Loader2
                        className={`h-4 w-4 animate-spin ${
                          isBoss ? "text-white" : "text-[#080C14]"
                        }`}
                      />
                      <span>
                        {isBoss ? "Defeating Boss..." : "Completing Quest..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {isBoss ? "Defeat Boss & Claim Rewards" : "Complete Quest"}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/protected")}
                  className="rounded-xl border border-white/10 bg-[#0E1526] hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-[var(--xp-text-muted)] hover:text-white transition-all cursor-pointer"
                >
                  Keep Quest Open
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      )}

      {/* Subtle Mobile/Bottom Quote */}
      <footer className="relative z-10 text-center py-2">
        <p className="text-[11px] text-[var(--xp-text-faint)] italic font-serif">
          &ldquo;Silence the storm within; let discipline guide your steel.&rdquo;
        </p>
      </footer>
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080C14] flex items-center justify-center text-xs text-[var(--xp-text-muted)]">
          Entering Focus Chamber...
        </div>
      }
    >
      <FocusContent />
    </Suspense>
  );
}
