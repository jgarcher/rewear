"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Validate a YYYY-MM-DD string. Returns the same string or throws.
function ensureValidDate(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error("Invalid date");
  // Reject obviously wrong dates (e.g. month 13)
  const d = new Date(s + "T00:00:00");
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return s;
}

// Find or create the user's scheduled outfit on a given date.
// Returns the outfit id.
async function getOrCreateScheduledOutfit(
  userId: string,
  scheduledDate: string,
  name?: string | null
): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("outfits")
    .select("id")
    .eq("user_id", userId)
    .eq("scheduled_date", scheduledDate)
    .is("worn_date", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    if (name) {
      await supabase
        .from("outfits")
        .update({ name })
        .eq("id", existing[0].id);
    }
    return existing[0].id;
  }

  const { data: created, error } = await supabase
    .from("outfits")
    .insert({
      user_id: userId,
      source: "user_logged",
      scheduled_date: scheduledDate,
      name: name || null,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Couldn't create");
  return created.id;
}

// Replace the items in a scheduled outfit with the new selection.
export async function saveScheduledOutfit(
  scheduledDate: string,
  itemIds: string[],
  name: string | null = null
): Promise<{ outfitId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const date = ensureValidDate(scheduledDate);
  const cleanIds = Array.from(new Set(itemIds.filter(Boolean)));
  if (cleanIds.length === 0) {
    throw new Error("Pick at least one item");
  }

  const outfitId = await getOrCreateScheduledOutfit(user.id, date, name);

  // Replace items: delete existing, insert new
  await supabase.from("outfit_items").delete().eq("outfit_id", outfitId);
  const rows = cleanIds.map((item_id) => ({
    outfit_id: outfitId,
    item_id,
  }));
  const { error: insertErr } = await supabase
    .from("outfit_items")
    .insert(rows);
  if (insertErr) throw new Error(insertErr.message);

  revalidatePath("/schedule");
  revalidatePath(`/schedule/${date}`);
  revalidatePath("/");
  return { outfitId };
}

// Add a single item to a date's scheduled outfit (creating the outfit if needed).
// Used by the "Add to schedule" CTA on item detail.
export async function addItemToSchedule(
  itemId: string,
  scheduledDate: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const date = ensureValidDate(scheduledDate);
  const outfitId = await getOrCreateScheduledOutfit(user.id, date);

  // Idempotent insert (composite PK rejects duplicates)
  const { error } = await supabase
    .from("outfit_items")
    .insert({ outfit_id: outfitId, item_id: itemId });
  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }

  revalidatePath("/schedule");
  revalidatePath(`/schedule/${date}`);
  revalidatePath("/");
  redirect(`/schedule/${date}`);
}

// Remove an entire scheduled outfit.
export async function deleteScheduledOutfit(
  outfitId: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // outfit_items cascades on outfit delete
  const { error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", outfitId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  revalidatePath("/");
}

// Wear a scheduled outfit today: sets worn_date, inserts wear_log rows,
// updates streak + lifetime_rewears. Skips items the user no longer owns
// or hasn't actually borrowed (matches the AI-outfit wear logic).
export async function wearScheduledOutfit(
  outfitId: string
): Promise<{ wornCount: number; newStreak: number; didIncrement: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const today = new Date().toISOString().slice(0, 10);

  // Mark the outfit as worn
  const { error: updErr } = await supabase
    .from("outfits")
    .update({ worn_date: today })
    .eq("id", outfitId)
    .eq("user_id", user.id);
  if (updErr) throw new Error(updErr.message);

  // Get items, filter to only those the user owns or is currently borrowing
  const { data: outfitItems } = await supabase
    .from("outfit_items")
    .select("item_id, wardrobe_items(user_id, lent_to_user_id)")
    .eq("outfit_id", outfitId);

  type Joined = {
    item_id: string;
    wardrobe_items:
      | { user_id: string; lent_to_user_id: string | null }
      | { user_id: string; lent_to_user_id: string | null }[]
      | null;
  };

  const wearable = ((outfitItems ?? []) as Joined[]).filter((oi) => {
    const wi = Array.isArray(oi.wardrobe_items)
      ? oi.wardrobe_items[0]
      : oi.wardrobe_items;
    if (!wi) return false;
    return wi.user_id === user.id || wi.lent_to_user_id === user.id;
  });

  // Skip items already logged today (idempotency, matches Log Outfit behaviour)
  const wearableIds = wearable.map((w) => w.item_id);
  let newIds: string[] = wearableIds;
  if (wearableIds.length > 0) {
    const { data: existingWears } = await supabase
      .from("wear_log")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("worn_date", today)
      .in("item_id", wearableIds);
    const already = new Set((existingWears ?? []).map((w) => w.item_id));
    newIds = wearableIds.filter((id) => !already.has(id));
  }

  if (newIds.length > 0) {
    const rows = newIds.map((item_id) => ({
      user_id: user.id,
      item_id,
      worn_date: today,
      outfit_id: outfitId,
    }));
    await supabase.from("wear_log").insert(rows);
  }

  // Streak / rewears
  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_count, last_logged_date, lifetime_rewears")
    .eq("user_id", user.id)
    .single();

  let newStreak = profile?.streak_count ?? 0;
  let didIncrement = false;

  if (profile) {
    const last = profile.last_logged_date;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
      newStreak = last === yesterday ? profile.streak_count + 1 : 1;
      didIncrement = true;
    }
    await supabase
      .from("profiles")
      .update({
        streak_count: newStreak,
        last_logged_date: today,
        lifetime_rewears: profile.lifetime_rewears + newIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/wardrobe");

  return { wornCount: newIds.length, newStreak, didIncrement };
}
