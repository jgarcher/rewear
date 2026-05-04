"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateTripPlan } from "@/lib/anthropic";

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

// === AI-assisted trip planning ===

const MAX_TRIP_DAYS = 14;
const ROLE_FROM_CATEGORY: Record<string, string> = {
  top: "top",
  tshirt: "top",
  bottom: "bottom",
  dress: "dress",
  coat: "coat",
  shoes: "shoes",
  accessory: "accessory",
};

function listDates(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  for (
    let d = new Date(start);
    d.getTime() <= end.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export async function planTripAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const from = (formData.get("from") as string)?.trim();
  const to = (formData.get("to") as string)?.trim();
  const tripContext = ((formData.get("trip_context") as string) || "").trim();
  const tripName = ((formData.get("trip_name") as string) || "").trim();

  ensureValidDate(from);
  ensureValidDate(to);
  if (from > to) throw new Error("From must be before to");

  const allDates = listDates(from, to);
  if (allDates.length > MAX_TRIP_DAYS) {
    throw new Error(`Trip is too long — keep it to ${MAX_TRIP_DAYS} days max.`);
  }

  // Check what's already scheduled in the range — skip those dates
  const { data: existingScheduled } = await supabase
    .from("outfits")
    .select("scheduled_date")
    .eq("user_id", user.id)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .is("worn_date", null);
  const alreadyScheduled = new Set(
    (existingScheduled ?? []).map((o) => o.scheduled_date as string)
  );
  const datesToFill = allDates.filter((d) => !alreadyScheduled.has(d));

  if (datesToFill.length === 0) {
    redirect(`/schedule?from=${from}&to=${to}`);
  }

  // Wardrobe (own items only — friend items handled separately later if needed)
  const { data: wardrobeRaw } = await supabase
    .from("wardrobe_items")
    .select(
      "id, name, category, subcategory, primary_colour, secondary_colour, brand, material, seasons, occasions, condition, status"
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  const wardrobeItems = wardrobeRaw ?? [];
  if (wardrobeItems.length < 5) {
    throw new Error(
      "Not enough pieces to plan a trip. Aim for at least 5 active items first."
    );
  }

  // Wear stats
  const { data: wears } = await supabase
    .from("wear_log")
    .select("item_id, worn_date")
    .eq("user_id", user.id)
    .order("worn_date", { ascending: false });
  const wearCounts: Record<string, number> = {};
  const lastWornDate: Record<string, string> = {};
  for (const w of wears ?? []) {
    wearCounts[w.item_id] = (wearCounts[w.item_id] ?? 0) + 1;
    if (!lastWornDate[w.item_id]) lastWornDate[w.item_id] = w.worn_date;
  }
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000)
    .toISOString()
    .slice(0, 10);
  const recentWearIds = Array.from(
    new Set(
      (wears ?? [])
        .filter((w) => w.worn_date >= fourteenDaysAgo)
        .map((w) => w.item_id)
    )
  );

  // Pairings + feedback (mirror the single-outfit path)
  const ownItemIds = wardrobeItems.map((i) => i.id);
  let favouritePairs: Array<{ name: string | null; itemIds: string[] }> = [];
  if (ownItemIds.length > 0) {
    const { data: setLinks } = await supabase
      .from("item_set_items")
      .select("set_id, item_id")
      .in("item_id", ownItemIds);
    const setIds = Array.from(new Set((setLinks ?? []).map((s) => s.set_id)));
    if (setIds.length > 0) {
      const [{ data: setMeta }, { data: allLinks }] = await Promise.all([
        supabase.from("item_sets").select("id, name").in("id", setIds),
        supabase
          .from("item_set_items")
          .select("set_id, item_id")
          .in("set_id", setIds),
      ]);
      const nameById = new Map(
        (setMeta ?? []).map((s) => [s.id, s.name as string | null])
      );
      const itemsBySet = new Map<string, string[]>();
      for (const l of allLinks ?? []) {
        const arr = itemsBySet.get(l.set_id) ?? [];
        arr.push(l.item_id);
        itemsBySet.set(l.set_id, arr);
      }
      favouritePairs = Array.from(itemsBySet.entries()).map(
        ([setId, itemIds]) => ({
          name: nameById.get(setId) ?? null,
          itemIds,
        })
      );
    }
  }

  const fourteenDaysAgoIso = new Date(
    Date.now() - 14 * 86400000
  ).toISOString();
  const { data: recentFeedback } = await supabase
    .from("outfit_feedback")
    .select("outfit_id, rating")
    .eq("user_id", user.id)
    .gte("created_at", fourteenDaysAgoIso)
    .order("created_at", { ascending: false })
    .limit(20);

  let likedCombos: string[][] = [];
  let dislikedCombos: string[][] = [];
  if ((recentFeedback ?? []).length > 0) {
    const allOutfitIds = (recentFeedback ?? []).map((r) => r.outfit_id);
    const { data: comboLinks } = await supabase
      .from("outfit_items")
      .select("outfit_id, item_id")
      .in("outfit_id", allOutfitIds);
    const itemsByOutfit = new Map<string, string[]>();
    for (const l of comboLinks ?? []) {
      const arr = itemsByOutfit.get(l.outfit_id) ?? [];
      arr.push(l.item_id);
      itemsByOutfit.set(l.outfit_id, arr);
    }
    for (const f of recentFeedback ?? []) {
      const items = itemsByOutfit.get(f.outfit_id);
      if (!items || items.length === 0) continue;
      if (f.rating === "up" && likedCombos.length < 5) {
        likedCombos.push(items);
      } else if (f.rating === "down" && dislikedCombos.length < 5) {
        dislikedCombos.push(items);
      }
    }
  }

  // Hydrate wardrobe with wear stats
  const wardrobeForAI = wardrobeItems.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    subcategory: i.subcategory,
    primary_colour: i.primary_colour,
    secondary_colour: i.secondary_colour,
    brand: i.brand,
    material: i.material,
    seasons: i.seasons,
    occasions: i.occasions,
    condition: i.condition,
    status: i.status,
    wear_count: wearCounts[i.id] ?? 0,
    last_worn_date: lastWornDate[i.id] ?? null,
    borrowable_from: null,
  }));

  // Generate
  let plan;
  try {
    plan = await generateTripPlan({
      wardrobe: wardrobeForAI,
      recentWearIds,
      startDate: datesToFill[0],
      endDate: datesToFill[datesToFill.length - 1],
      numDays: datesToFill.length,
      tripContext,
      favouritePairs: favouritePairs.length > 0 ? favouritePairs : undefined,
      likedCombos: likedCombos.length > 0 ? likedCombos : undefined,
      dislikedCombos: dislikedCombos.length > 0 ? dislikedCombos : undefined,
    });
  } catch (err) {
    console.error("Trip plan generation failed:", err);
    throw new Error(
      "We couldn't put a trip plan together right now. Try again in a moment?"
    );
  }

  // Validate item ids and override roles from category
  const wardrobeIdSet = new Set(wardrobeItems.map((i) => i.id));
  const itemsById = new Map(wardrobeItems.map((i) => [i.id, i]));

  // Persist: one outfit row per planned day
  const finalTripName = tripName || plan.trip_name?.trim() || null;

  for (const day of plan.days) {
    if (day.outfit === null) continue;
    if (day.day_index < 0 || day.day_index >= datesToFill.length) continue;
    const scheduledDate = datesToFill[day.day_index];

    // Filter items + override role
    const validItems = day.outfit.items
      .filter((it) => wardrobeIdSet.has(it.item_id))
      .map((it) => {
        const real = itemsById.get(it.item_id);
        const correctRole =
          (real && ROLE_FROM_CATEGORY[real.category]) ?? it.role;
        return { item_id: it.item_id, role: correctRole };
      });
    if (validItems.length < 2) continue; // skip incoherent days

    const outfitId = crypto.randomUUID();
    const dayName = finalTripName
      ? `${finalTripName} · day ${day.day_index + 1}`
      : null;

    const { error: outfitErr } = await supabase.from("outfits").insert({
      id: outfitId,
      user_id: user.id,
      source: "ai_generated",
      name: dayName,
      scheduled_date: scheduledDate,
      ai_reasoning: day.outfit.reasoning,
    });
    if (outfitErr) {
      console.error("Failed to create scheduled outfit:", outfitErr);
      continue;
    }

    const itemRows = validItems.map((it) => ({
      outfit_id: outfitId,
      item_id: it.item_id,
      role: it.role,
    }));
    const { error: linkErr } = await supabase
      .from("outfit_items")
      .insert(itemRows);
    if (linkErr) {
      console.error("Failed to link items to scheduled outfit:", linkErr);
      // Roll back the outfit row to avoid orphan
      await supabase.from("outfits").delete().eq("id", outfitId);
    }
  }

  revalidatePath("/schedule");
  revalidatePath("/");
  redirect(`/schedule?from=${from}&to=${to}`);
}
