"use server";

import { createClient } from "@/lib/supabase/server";

export type ShopItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
  shop_items: ShopItem | null;
};

export type PurchaseItemResult = {
  success: boolean;
  itemId: string;
  itemName: string;
  pricePaid: number;
  remainingGold: number;
};

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

function mapRpcError(message: string): string {
  const known = [
    "UNAUTHENTICATED",
    "NOT_FOUND",
    "INVALID_ITEM",
    "ALREADY_OWNED",
    "CHARACTER_NOT_FOUND",
    "INSUFFICIENT_GOLD",
  ];
  return known.includes(message) ? message : "DATABASE_ERROR";
}

export async function getShopItems(): Promise<ActionResult<ShopItem[]>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { data, error } = await supabase
    .from("shop_items")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true });

  if (error) return { error: "DATABASE_ERROR" };
  return { data: data as ShopItem[] };
}

export async function getInventory(): Promise<ActionResult<InventoryItem[]>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { data, error } = await supabase
    .from("user_inventory")
    .select("*, shop_items(*)")
    .order("purchased_at", { ascending: false });

  if (error) return { error: "DATABASE_ERROR" };
  return { data: data as unknown as InventoryItem[] };
}

/**
 * The only way a purchase happens. Sends nothing but the item ID — price
 * is read from shop_items and gold is checked/deducted inside
 * purchase_item() in Postgres, not here.
 */
export async function purchaseItem(
  itemId: string
): Promise<ActionResult<PurchaseItemResult>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "UNAUTHENTICATED" };

  const { data, error } = await supabase.rpc("purchase_item", {
    p_item_id: itemId,
  });

  if (error) return { error: mapRpcError(error.message) };
  return { data: data as PurchaseItemResult };
}
