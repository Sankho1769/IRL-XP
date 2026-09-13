import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sparkles, Shield, ArrowRight, Target, Award, HeartPulse } from "lucide-react";
import "@/styles/dashboard.css";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/protected");
  }

  const features = [
    { title: "Real Life Quests", desc: "Turn habits into XP", icon: Target, color: "#F97316" },
    { title: "Level Up & Stats", desc: "5 core RPG attributes", icon: Sparkles, color: "#38BDF8" },
    { title: "The Grand Bazaar", desc: "Cosmetics & rewards", icon: Award, color: "#E5B869" },
    { title: "Story Chronicles", desc: "Every habit writes a page", icon: HeartPulse, color: "#10B981" },
  ];

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#080C14] text-[#F3F4F6]">
      {/* Background Hero Banner */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/hero_bg.jpg"
          alt="IRL XP Realm Background"
          className="h-full w-full object-cover object-center opacity-40 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080C14] via-[#080C14]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-transparent to-black/60" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--xp-border-gold)] bg-gradient-to-br from-[var(--xp-gold)]/20 to-[#080C14] shadow-md">
            <Shield className="h-5 w-5 text-[var(--xp-gold)]" />
          </div>
          <span className="font-rpg text-xl font-bold tracking-wider text-[var(--xp-text)]">
            IRL <span className="text-[var(--xp-gold)]">XP</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-[var(--xp-text-muted)] hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="xp-btn-gold px-4 py-2 text-xs font-bold"
          >
            Begin Journey
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 sm:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Hero Column */}
        <div className="max-w-2xl flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 px-3 py-1 text-[11px] font-bold tracking-widest text-[var(--xp-gold)] uppercase">
              Your Story. A Better You.
            </span>
          </div>

          <h1 className="font-rpg text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight text-[var(--xp-text)]">
            Every Small Step <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5C362] via-[var(--xp-gold)] to-[#C99738]">
              Builds a Greater Story
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--xp-text-muted)] leading-relaxed font-serif max-w-xl">
            Turn your daily habits into an epic adventure. Complete quests in reality, gain XP, level up your attributes, and become the hero of your own life.
          </p>

          {/* Features Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/5 bg-[#0D1322]/80 p-3 flex flex-col gap-1.5 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4" style={{ color: feat.color }} />
                  <span className="text-xs font-bold text-[var(--xp-text)] block leading-tight">
                    {feat.title}
                  </span>
                  <span className="text-[10px] text-[var(--xp-text-faint)] leading-tight">
                    {feat.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/login"
              className="xp-btn-gold flex items-center gap-2 px-6 py-3.5 text-sm font-bold shadow-xl shadow-[var(--xp-gold)]/20"
            >
              <span>Begin Your Journey</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Atmospheric Hero Card */}
        <div className="relative w-full max-w-md lg:max-w-lg hidden md:block">
          <div className="xp-panel overflow-hidden border border-[var(--xp-border-gold)] shadow-2xl p-0 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/character_portrait.jpg"
              alt="Adventurer"
              className="w-full h-96 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--xp-gold)] block">
                The Realm of Reality
              </span>
              <p className="text-xs text-[var(--xp-text-muted)] font-serif italic mt-1">
                &ldquo;Not all those who wander are lost — some are just becoming better.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--xp-text-faint)]">
        <p>IRL XP — Turn Real Life into an RPG Adventure.</p>
        <p className="font-serif italic">&ldquo;Discipline today, a greater tomorrow.&rdquo;</p>
      </footer>
    </main>
  );
}
