// app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Sparkles, ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { IRLXPAuthLoader } from "@/components/ui/IRLXPAuthLoader";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        router.replace("/protected");
      } else {
        setCheckingSession(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Keep loading true during navigation to avoid blank screen
    router.push("/protected");
    router.refresh();
  }

  if (checkingSession) {
    return <IRLXPAuthLoader message="Preparing your journey..." />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#080C14]">
      {/* Cinematic Background Image Container */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/hero_bg.jpg"
          alt="IRL XP Realm"
          className="h-full w-full object-cover object-center opacity-35 filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/70 to-[#080C14]/40" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#080C14]/50 to-[#080C14]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Brand Crest */}
        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--xp-border-gold)] bg-gradient-to-br from-[var(--xp-gold)]/25 to-[#080C14] shadow-xl shadow-[var(--xp-gold)]/10">
            <Shield className="h-6 w-6 text-[var(--xp-gold)]" />
          </div>
          <h1 className="font-rpg text-2xl font-bold tracking-wider text-[var(--xp-text)] mt-1">
            IRL <span className="text-[var(--xp-gold)]">XP</span>
          </h1>
          <p className="text-xs text-[var(--xp-text-muted)] font-serif italic">
            Turn your daily habits into an epic adventure.
          </p>
        </div>

        {/* Login / Signup Card */}
        <div className="w-full rounded-2xl border border-[var(--xp-border-gold)]/40 bg-[#0D1322]/85 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/40 p-1 mb-6 border border-white/5">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (loading) return;
                setMode("login");
                setError(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "login"
                  ? "bg-[var(--xp-gold)] text-[#080C14] shadow-md"
                  : "text-[var(--xp-text-muted)] hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (loading) return;
                setMode("signup");
                setError(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "signup"
                  ? "bg-[var(--xp-gold)] text-[#080C14] shadow-md"
                  : "text-[var(--xp-text-muted)] hover:text-white"
              }`}
            >
              Begin Journey
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--xp-text)] mb-1.5">
                Adventurer Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--xp-text-faint)]" />
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  placeholder="adventurer@realm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0D1322] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-[var(--xp-gold)] focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--xp-text)] mb-1.5">
                Secret Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--xp-text-faint)]" />
                <input
                  id="password"
                  type="password"
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0D1322] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-[var(--xp-gold)] focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-[var(--xp-ember)]/40 bg-[var(--xp-ember)]/10 px-3.5 py-2.5 text-xs text-[var(--xp-ember)] font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="xp-btn-gold mt-2 flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-wide cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-md hover:shadow-[0_0_15px_rgba(229,184,105,0.3)] transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#080C14]" />
                  <span>{mode === "login" ? "Logging in..." : "Creating character..."}</span>
                </span>
              ) : mode === "login" ? (
                "Enter The Realm →"
              ) : (
                "Claim Your Legend →"
              )}
            </button>
          </form>

          {/* Subtext */}
          <div className="mt-5 text-center pt-4 border-t border-white/5">
            <p className="text-[11px] text-[var(--xp-text-faint)] font-serif italic">
              &ldquo;A better you is a story worth writing.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
