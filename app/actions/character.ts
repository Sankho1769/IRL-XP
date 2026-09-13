"use server";

import { createClient } from "@/lib/supabase/server";

export type Character = {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  gold: number;
  attributes: {
    strength: number;
    intelligence: number;
    discipline: number;
    health: number;
    creativity: number;
  };
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
};

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

/**
 * Returns the current authenticated user's character.
 * Read-only — characters are never written to from the client, only via
 * the complete_quest / purchase_item RPCs (see app/actions/quests.ts and
 * app/actions/shop.ts).
 */
export async function getCharacter(): Promise<ActionResult<Character>> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "UNAUTHENTICATED" };
  }

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // PGRST116 = no row found for .single() — the signup initialization
    // trigger creates this row automatically, so this branch should only
    // hit for an account that predates the trigger or in an edge case.
    if (error.code === "PGRST116") {
      return { error: "CHARACTER_NOT_FOUND" };
    }
    // TEMPORARY diagnostic logging — safe fields only (no tokens, no
    // env values, no full request/session objects). Remove once the
    // DATABASE_ERROR root cause is confirmed.
    console.error("[getCharacter] Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: "DATABASE_ERROR" };
  }

  return { data: data as Character };
}
