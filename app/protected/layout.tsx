// app/protected/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCharacter } from "@/app/actions/character";
import { getQuests, getQuestCompletions } from "@/app/actions/quests";
import { getShopItems, getInventory } from "@/app/actions/shop";
import { getAchievements } from "@/app/actions/achievements";
import { getProfile } from "@/app/actions/profile";
import { DashboardProvider } from "./DashboardContext";
import { ProtectedShell } from "@/components/dashboard/ProtectedShell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Real Supabase data via authoritative server actions
  const [
    characterResult,
    questsResult,
    completionsResult,
    shopItemsResult,
    inventoryResult,
    achievementsResult,
    profileResult,
  ] = await Promise.all([
    getCharacter(),
    getQuests(),
    getQuestCompletions(),
    getShopItems(),
    getInventory(),
    getAchievements(),
    getProfile(),
  ]);

  if (characterResult.error === "UNAUTHENTICATED") {
    redirect("/login");
  }

  return (
    <DashboardProvider
      userEmail={user.email ?? ""}
      initialCharacter={characterResult.data ?? null}
      characterError={characterResult.error ?? null}
      initialQuests={questsResult.data ?? []}
      initialCompletions={completionsResult.data ?? []}
      initialShopItems={shopItemsResult.data ?? []}
      initialInventory={inventoryResult.data ?? []}
      initialAchievements={achievementsResult.data ?? []}
      initialProfile={profileResult.data ?? null}
    >
      <ProtectedShell>{children}</ProtectedShell>
    </DashboardProvider>
  );
}
