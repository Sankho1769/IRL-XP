# IRL XP

> **Turn real life into an RPG.**

IRL XP is a gamified personal productivity system designed to turn real-world effort into RPG character progression.

Real-world tasks become **Quests**, high-stakes deadlines become **Boss Events**, and deep work happens inside the distraction-free **Focus Mode**.

Completing real-life tasks awards server-verified **XP**, **Gold**, **Streaks**, and permanent **Attribute** growth across:

* Strength
* Intelligence
* Discipline
* Health
* Creativity

The goal is simple: make everyday progress visible, rewarding, and motivating.

---

## 🌟 Overview

* **Real-World Tasks → Quests**: Daily habits, weekly milestones, one-time objectives, and custom-deadline tasks.
* **Deadlines → Boss Events**: High-priority tasks become time-limited RPG encounters with bonus rewards.
* **Deep Work → Focus Mode**: A distraction-free Countdown or Stopwatch designed for focused work.
* **Completion → Progression**: Successful quests award XP, Gold, Streaks, and Attribute progress.
* **Views → Board & List**: Tactical Guild Board (default) and structured Quest Log with instant search/filter synchronization.
* **Identity & Aesthetics → Profile Customization**: Adventurer profile photo upload, display name editing, and 3 dark RPG themes.

---

## ✨ Features

### 🔐 Authentication & Loading Flow

* Secure email/password sign-up and login via Supabase Auth
* Server-side session synchronization with `@supabase/ssr`
* Protected routes with automatic session redirection
* Automatic starter-character creation on initial onboarding
* **Smooth Loading States**: Immediate button state updates (`Logging in...`), disabled inputs, duplicate submission protection, and cinematic IRL XP shield loading screens with zero white flicker.

### ⚔️ Quest System & Dual Views

* **Board View (Default Experience)**:
  * Tactical dark fantasy RPG guild board organized into **TODAY**, **THIS WEEK**, and **ONE-TIME** columns.
  * Prominent top **BOSS EVENT** section with thematic artwork and countdowns.
  * Responsive **COMPLETED** archive section showing recent triumphs.
  * Synchronized search bar and filter tabs that seamlessly filter board columns in real time.
* **List View**:
  * Structured quest log with filter pills, category tabs, and quick completions.
* **Shared State & Persistence**:
  * Both views share the identical server-authoritative state, completion handler, and Supabase backend.
  * View preference is persisted in `localStorage` under `irl_xp_quest_view_preference` (defaulting to `"board"`).
* **Interactive Three-Dot Options Menu**:
  * Enter Focus Chamber directly with the quest selected.
  * Toggle Pin / Important status.
  * Abandon / Delete quest with modal confirmation.
* **Quest Types**:
  * Daily quests (recurring each calendar day in `Asia/Kolkata`)
  * Weekly quests (recurring each calendar week)
  * One-time tasks
  * Custom Date quests with specific future deadlines
  * Important quest pinning
  * Duplicate completion prevention

### 🛡️ Profile Customization & Themes

* **Display Name**: Edit player callsign / adventurer name (2–50 characters) with server-side validation.
* **Avatar Management**:
  * Upload custom avatar images (JPG, PNG, WebP up to 5MB) with instant local preview.
  * Uploads to Supabase Storage `avatars` bucket with magic byte validation and public URL persistence.
  * Remove custom avatar with 1 click to restore the classic character portrait.
  * Dynamically displayed across the dashboard navigation and topbar.
* **3 Cinematic Dark RPG Themes**:
  1. **IRL XP Dark** (Default): Deep midnight navy (`#080C14`), charcoal, and radiant gold (`#F5C362`).
  2. **Crimson Knight**: Dark charcoal, deep blood ruby (`#2C1829`), and vivid crimson (`#EF4444`).
  3. **Arcane Night**: Deep cosmic midnight, obsidian violet (`#221B48`), and luminous arcane violet (`#A78BFA`).
  * Theme preference stored in database `profiles.theme` and applied instantly via `data-theme`.

### 🎨 Atmospheric Desktop SVG Ornaments

* **Large-Screen Only** (`hidden lg:block pointer-events-none`):
  * Ornate corner filigree brackets on quest cards, boss containers, and panels.
  * Runic winged sword guild crest dividers.
  * Deep atmospheric runic background watermark.
  * Lightweight desktop-only SVG ornaments designed to minimize layout impact and avoid interfering with interaction.

### ⚔️ Boss Events

Boss Events turn high-stakes real-world deadlines into RPG encounters.

* Dedicated Boss Event creation flow
* Exact deadline with live countdown
* Base rewards + Boss bonus rewards (Bonus XP: 0–500, Bonus Gold: 0–250)
* Distinct dark fantasy card artwork and metallic borders
* Prominently displayed at the top of the Quest Board
* Expired Bosses remain visible as a missed state rather than silently disappearing
* Boss victory feedback and celebrations
* Server-authoritative expiration enforcement

### ⚖️ Missed-Deadline Penalty System

* **Server-Authoritative**: Handled inside PostgreSQL via `process_deadline_penalties()` using `auth.uid()`.
* **Asia/Kolkata Calendar Logic**:
  * 0 calendar days late: 0 penalty (same day grace period)
  * 1 calendar day late: -15 quest progress/integrity
  * 2 calendar days late: -20 quest progress/integrity
  * 3+ calendar days late: -25 quest progress/integrity
* **Integrity Floor**: Progress clamped at 0 (`GREATEST(progress - penalty, 0)`).
* **Zero XP Loss**: Missed deadline penalties apply strictly to quest momentum/integrity; character XP, Level, Gold, and Streaks are never deducted.
* **Atomic Idempotency Gate**: Protected by `quest_deadline_penalties` table with `UNIQUE (user_id, quest_id)`. Progress is decremented only in the transaction that claims the penalty record.

### 🏆 Trophies & Milestones

* Built-in milestone trophy system (`supabase/migrations/007_achievements.sql`)
* Rewards first quest completion, 10 quests, 50 quests, 7-day streaks, boss victories, and character levels
* Celebration overlays upon earning achievements
* Visual trophy gallery displayed on the Character sheet

### 📈 Non-Linear XP Progression

Character progression uses an authoritative PostgreSQL leveling formula:

```sql
xp_required_for_level(level) = round(100 * level^1.5)
```

Higher levels require progressively more XP. The database remains the source of truth for level progression.

### 🔥 Streak System

* Daily activity streaks
* Server-authoritative calculations in `Asia/Kolkata`
* Streak increments on completing eligible daily quests

### 🧬 Character Attributes

Each quest contributes to one of five core attributes:

* **Strength**
* **Intelligence**
* **Discipline**
* **Health**
* **Creativity**

Attribute increments are evaluated and recorded during authoritative quest completion.

### 💰 Gold Economy & Bazaar

* Earn Gold through quest completion and Boss events
* Spend Gold on cosmetic items, themes, avatars, and titles via the authoritative `purchase_item()` PostgreSQL function
* Real-time balance updates and duplicate purchase protection

### 🎯 Focus Mode

A distraction-free productivity chamber for deep work.

* **Countdown**: 15m, 25m, 45m, 60m presets and custom durations
* **Stopwatch**: Elapsed-time tracking
* Quest-linked and Boss-linked sessions
* Explicit completion trigger calling the authoritative quest-completion flow

---

## 🏛️ Technical Architecture

### Frontend

* **Next.js 14** (App Router)
* **React 18**
* **TypeScript**
* **Tailwind CSS**
* **Lucide React** icons

### Backend & Server Actions

* Next.js Server Actions:
  * `app/actions/character.ts`
  * `app/actions/quests.ts`
  * `app/actions/shop.ts`
  * `app/actions/achievements.ts`
  * `app/actions/profile.ts`
* PostgreSQL RPC integration (`complete_quest`, `purchase_item`, `process_deadline_penalties`)

### Database & Security

* **Supabase PostgreSQL** with Row Level Security (RLS) enabled on all tables
* All mutations derive the active user from `auth.uid()` (browser user IDs are never trusted)
* Search path configured to `public, pg_temp` on `SECURITY DEFINER` functions

---

## 🗄️ Database Migrations

Run the migrations in exact numerical order:

1. `001_irl_xp_schema.sql` — Core profiles, characters, quests, completions, shop items, inventory, leveling formula.
2. `002_irl_xp_rls.sql` — Row Level Security policies for all tables.
3. `003_irl_xp_game_logic.sql` — Authoritative `complete_quest()` and `purchase_item()` RPCs.
4. `004_irl_xp_quest_reward_limits.sql` — Base reward constraints (XP: 0-100, Gold: 0-50).
5. `005_irl_xp_authenticated_grants.sql` — Permissions for authenticated role.
6. `006_custom_date_and_boss_quests.sql` — Custom deadlines, Boss events, bonus rewards, expiration enforcement.
7. `007_achievements.sql` — Trophy milestones, user achievements table, and unlock evaluation.
8. `008_deadline_penalties.sql` — Quest progress column, deadline penalties audit table, atomic `process_deadline_penalties()` RPC.
9. `009_profile_customization.sql` — Profile `avatar_url` and `theme` columns, `avatars` storage bucket, and user-isolated RLS policies.
10. `010_profile_theme_and_avatar.sql` — Comprehensive idempotent profile & avatar migration: schema columns, `profiles` RLS (SELECT/UPDATE/INSERT), authenticated grants, `avatars` storage bucket with 5MB limit, MIME whitelist, and user-scoped storage policies.

---

## 🚀 Getting Started

### 1. Prerequisites

* Node.js 18.x or 20.x
* A Supabase project with database migrations applied
* Git

### 2. Installation

```bash
git clone <repository-url>
cd "IRL XP"
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Never commit `.env.local` or service-role keys to version control.)*

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## 🧪 Build & Type Verification

```bash
# Verify TypeScript definitions
npx tsc --noEmit

# Run Next.js linter
npm run lint

# Compile production build
npm run build
```

---

## ☁️ Deployment

IRL XP can be deployed on standard Next.js hosting platforms such as **Vercel** or **Netlify**:

1. Push code to your Git repository.
2. Connect your repository to your hosting provider.
3. Add the production environment variables:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy the application.

---

## 🎮 Recommended Demo Flow

1. **Sign In**: Navigate to `/login`, test credentials or create an adventurer.
2. **Tactical Quest Board**: Navigate to `/protected/quests`. Notice **Board View** is active by default with real-time category filtering and live search.
3. **Card Options**: Click the `•••` options menu on any quest card to jump into the **Focus Chamber**, toggle **Pin as Important**, or **Abandon** the quest.
4. **Inscribe Quest**: Click `+ New Quest` to create a Daily Quest. Notice it instantly appears in the **TODAY** column.
5. **Complete Quest**: Mark it complete. Notice immediate progression feedback and transition to the **COMPLETED** section.
6. **Summon Boss Event**: Create a Boss Event with a deadline. Notice it renders prominently in the **BOSS EVENT** section with dragon artwork, rewards, and countdown.
7. **Profile & Theme Customization**: Click the Settings icon in the header navigation to open the **Adventurer Profile & Settings** modal. Edit your display name, upload or preview a custom avatar, and switch themes between **IRL XP Dark**, **Crimson Knight**, and **Arcane Night**.
8. **Character Sheet**: Visit `/protected/character` to view updated Level, XP, Attributes, Streaks, and unlocked Trophies.
9. **Shop / Bazaar**: Visit `/protected/shop` and acquire an item using earned Gold.
10. **Focus Mode**: Enter `/protected/focus` to run a deep work countdown or stopwatch session.

---

## 👤 Project

**IRL XP** — *Turn real life into an RPG.*  
Built for **Tech Zephyr 4.0**.  
**Author:** Shubham Banerjee
