"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateOutfit, type OutfitResult } from "@/lib/anthropic";
import { getWeather } from "@/lib/weather";

type OccasionValue =
  | "school"
  | "work"
  | "going-out"
  | "errands"
  | "special"
  | "just-home";
type VibeValue = "cosy" | "sharp" | "easy" | "dressed-up" | "surprise" | "";

const OCCASIONS: OccasionValue[] = [
  "school",
  "work",
  "going-out",
  "errands",
  "special",
  "just-home",
];

// Threshold for the magic button: enough variety for the AI to do its thing.
const MAGIC_MIN_ITEMS = 10;

// Pick a sensible occasion based on time of day. Day = casual, evening = going-out, weekend = casual.
function defaultMagicOccasion(): OccasionValue {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 6=Sat
  const hour = d.getHours();
  if (day === 0 || day === 6) return "errands";
  if (hour >= 18) return "going-out";
  if (hour < 9) return "school";
  return "errands";
}

// Magic button: tap once, get a surprise outfit. Redirects to either the
// onboarding nudge (if wardrobe is too thin) or the generated result page.
export async function magicOutfitAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { count } = await supabase
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if ((count ?? 0) < MAGIC_MIN_ITEMS) {
    redirect("/wardrobe/add?magic=needs-items");
  }

  const outfitId = await runGenerationAndSave({
    userId: user.id,
    occasion: defaultMagicOccasion(),
    vibe: "surprise",
    additionalExclusions: [],
  });

  redirect(`/outfit/result/${outfitId}`);
}

export async function generateOutfitAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const occasion = formData.get("occasion") as OccasionValue;
  const vibe = (formData.get("vibe") as VibeValue) || "";
  const additionalExclusions =
    (formData.get("exclude_item_ids") as string)?.split(",").filter(Boolean) ??
    [];

  if (!occasion || !OCCASIONS.includes(occasion)) {
    throw new Error("Pick an occasion");
  }

  const outfitId = await runGenerationAndSave({
    userId: user.id,
    occasion,
    vibe,
    additionalExclusions,
  });

  revalidatePath("/outfit");
  redirect(`/outfit/result/${outfitId}`);
}

export async function shuffleOutfitAction(formData: FormData) {
  const previousOutfitId = formData.get("previous_outfit_id") as string;
  if (!previousOutfitId) throw new Error("Missing previous_outfit_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Look up the previous outfit's context and items
  const { data: prev } = await supabase
    .from("outfits")
    .select("occasion, weather, ai_reasoning")
    .eq("id", previousOutfitId)
    .eq("user_id", user.id)
    .single();
  if (!prev) throw new Error("Previous outfit not found");

  const { data: prevItems } = await supabase
    .from("outfit_items")
    .select("item_id")
    .eq("outfit_id", previousOutfitId);

  // Re-derive vibe from weather field (we stored "occasion · vibe" pattern? Let's just default)
  // For v1, vibe defaults to surprise on shuffle.
  const newOutfitId = await runGenerationAndSave({
    userId: user.id,
    occasion: (prev.occasion ?? "school") as OccasionValue,
    vibe: "surprise",
    additionalExclusions: (prevItems ?? []).map((p) => p.item_id),
  });

  revalidatePath("/outfit");
  redirect(`/outfit/result/${newOutfitId}`);
}

export async function wearOutfitAction(formData: FormData) {
  const outfitId = formData.get("outfit_id") as string;
  if (!outfitId) throw new Error("Missing outfit_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const today = new Date().toISOString().slice(0, 10);

  // Mark the outfit as worn today
  const { error: outfitError } = await supabase
    .from("outfits")
    .update({ worn_date: today, source: "ai_accepted" })
    .eq("id", outfitId)
    .eq("user_id", user.id);
  if (outfitError) throw new Error(outfitError.message);

  // Get the items in this outfit, joined to owner + borrowed-by status
  const { data: outfitItems } = await supabase
    .from("outfit_items")
    .select("item_id, wardrobe_items(user_id, lent_to_user_id)")
    .eq("outfit_id", outfitId);

  // Only log wear for items the user owns OR is currently borrowing.
  // AI-suggested friend items the user hasn't borrowed yet are aspirational —
  // they don't count as worn until the borrow flow completes.
  type Joined = {
    item_id: string;
    wardrobe_items:
      | { user_id: string; lent_to_user_id: string | null }
      | { user_id: string; lent_to_user_id: string | null }[]
      | null;
  };
  const wearableItems = ((outfitItems ?? []) as Joined[]).filter((oi) => {
    const wi = Array.isArray(oi.wardrobe_items)
      ? oi.wardrobe_items[0]
      : oi.wardrobe_items;
    if (!wi) return false;
    return wi.user_id === user.id || wi.lent_to_user_id === user.id;
  });

  if (wearableItems.length > 0) {
    // Insert wear log entries for each item, linked to this outfit
    const wearRows = wearableItems.map((oi) => ({
      user_id: user.id,
      item_id: oi.item_id,
      worn_date: today,
      outfit_id: outfitId,
    }));
    await supabase.from("wear_log").insert(wearRows);

    // Bump streak + lifetime_rewears (one streak day, one rewear per item)
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count, last_logged_date, lifetime_rewears")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const last = profile.last_logged_date;
      let newStreak = profile.streak_count;
      if (last !== today) {
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);
        newStreak = last === yesterday ? profile.streak_count + 1 : 1;
      }
      await supabase
        .from("profiles")
        .update({
          streak_count: newStreak,
          last_logged_date: today,
          lifetime_rewears: profile.lifetime_rewears + wearableItems.length,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/");
  revalidatePath("/outfit");
  revalidatePath("/wardrobe");
  redirect("/");
}

// === Helpers ===

async function runGenerationAndSave(input: {
  userId: string;
  occasion: OccasionValue;
  vibe: VibeValue;
  additionalExclusions: string[];
}): Promise<string> {
  const supabase = await createClient();

  // Fetch active own items + friend borrowable items in parallel
  const [{ data: ownRaw }, { data: friendConnections }] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select(
        "id, user_id, name, category, subcategory, primary_colour, secondary_colour, brand, material, seasons, occasions, condition, status"
      )
      .eq("user_id", input.userId)
      .eq("status", "active"),
    supabase
      .from("connections")
      .select("friend_id")
      .eq("user_id", input.userId),
  ]);

  const ownItems = ownRaw ?? [];
  const friendIds = (friendConnections ?? []).map((c) => c.friend_id);

  // Friends' borrowable items (not currently lent)
  let friendItems: typeof ownItems = [];
  const friendOwnerNames = new Map<string, string>();
  if (friendIds.length > 0) {
    const [{ data: friendItemsRaw }, { data: friendProfiles }] =
      await Promise.all([
        supabase
          .from("wardrobe_items")
          .select(
            "id, user_id, name, category, subcategory, primary_colour, secondary_colour, brand, material, seasons, occasions, condition, status"
          )
          .in("user_id", friendIds)
          .in("share_state", ["borrowable", "up_for_grabs"])
          .is("lent_to_user_id", null)
          .eq("status", "active"),
        supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", friendIds),
      ]);
    friendItems = friendItemsRaw ?? [];
    for (const p of friendProfiles ?? []) {
      friendOwnerNames.set(p.user_id, p.display_name ?? "Friend");
    }
  }

  const wardrobeItems = [...ownItems, ...friendItems];

  if (wardrobeItems.length < 3) {
    throw new Error(
      "You'll need at least 3 items in your wardrobe before we can build outfits."
    );
  }

  // Wear stats for each item
  const ids = wardrobeItems.map((i) => i.id);
  const { data: wears } = await supabase
    .from("wear_log")
    .select("item_id, worn_date")
    .eq("user_id", input.userId)
    .in("item_id", ids)
    .order("worn_date", { ascending: false });

  const wearCounts: Record<string, number> = {};
  const lastWornDate: Record<string, string> = {};
  for (const w of wears ?? []) {
    wearCounts[w.item_id] = (wearCounts[w.item_id] ?? 0) + 1;
    if (!lastWornDate[w.item_id]) lastWornDate[w.item_id] = w.worn_date;
  }

  // Recent wears (last 14 days) — items to avoid repeating
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
  const exclusions = Array.from(
    new Set([...recentWearIds, ...input.additionalExclusions])
  );

  // Hydrate wardrobe with wear stats + borrowable_from for friend items
  const wardrobeForAI = wardrobeItems.map((i) => {
    const isOwn = i.user_id === input.userId;
    return {
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
      borrowable_from: isOwn ? null : friendOwnerNames.get(i.user_id) ?? null,
    };
  });

  // Pairings: user's curated sets that include any of the candidate items
  const ownItemIds = ownItems.map((i) => i.id);
  let favouritePairs: Array<{ name: string | null; itemIds: string[] }> = [];
  if (ownItemIds.length > 0) {
    const { data: setLinks } = await supabase
      .from("item_set_items")
      .select("set_id, item_id")
      .in("item_id", ownItemIds);
    const setIds = Array.from(
      new Set((setLinks ?? []).map((s) => s.set_id))
    );
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

  // Recent thumbs-up / thumbs-down outfits (last 14 days, capped at 5 each)
  const fourteenDaysAgoIso = new Date(
    Date.now() - 14 * 86400000
  ).toISOString();
  const { data: recentFeedback } = await supabase
    .from("outfit_feedback")
    .select("outfit_id, rating")
    .eq("user_id", input.userId)
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

  // Weather
  const weather = await getWeather();

  // Generate
  let result: OutfitResult;
  try {
    result = await generateOutfit({
      wardrobe: wardrobeForAI,
      recentWearIds: exclusions,
      occasion: input.occasion,
      vibe: input.vibe || null,
      weatherTempC: weather.temp_c,
      weatherCondition: weather.condition,
      weatherDescription: weather.description,
      favouritePairs: favouritePairs.length > 0 ? favouritePairs : undefined,
      likedCombos: likedCombos.length > 0 ? likedCombos : undefined,
      dislikedCombos: dislikedCombos.length > 0 ? dislikedCombos : undefined,
    });
  } catch (err) {
    console.error("AI generation failed:", err);
    throw new Error(
      "We couldn't put one together right now. Try again in a moment?"
    );
  }

  // Validate item_ids exist in the wardrobe AND override the AI's role with the
  // actual item category. The AI sometimes labels a skirt or jeans as
  // "accessory" — that's confusing. Source of truth is the item's category.
  const itemsById = new Map(wardrobeItems.map((i) => [i.id, i]));
  // Map item categories to outfit roles (tshirt rolls up to "top")
  const roleFromCategory: Record<string, string> = {
    top: "top",
    tshirt: "top",
    bottom: "bottom",
    dress: "dress",
    coat: "coat",
    shoes: "shoes",
    accessory: "accessory",
  };
  if (result.outfit) {
    result.outfit.items = result.outfit.items
      .map((it) => {
        const real = itemsById.get(it.item_id);
        if (!real) return null;
        const correctRole = roleFromCategory[real.category] ?? it.role;
        return { ...it, role: correctRole as typeof it.role };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (result.outfit.items.length < 2) {
      result.outfit = null;
      result.fallback_message =
        result.fallback_message ??
        "We couldn't put a coherent outfit together this time.";
    }
  }

  // Save the outfit
  const outfitId = crypto.randomUUID();
  const { error: outfitError } = await supabase.from("outfits").insert({
    id: outfitId,
    user_id: input.userId,
    source: "ai_generated",
    weather: weather.description,
    occasion: input.occasion,
    ai_reasoning: result.outfit
      ? [result.outfit.reasoning, result.outfit.weather_note]
          .filter(Boolean)
          .join(" ")
      : (result.fallback_message ?? "Could not compose"),
    worn_date: null,
  });
  if (outfitError) throw new Error(outfitError.message);

  if (result.outfit && result.outfit.items.length > 0) {
    const itemRows = result.outfit.items.map((it) => ({
      outfit_id: outfitId,
      item_id: it.item_id,
      role: it.role,
    }));
    await supabase.from("outfit_items").insert(itemRows);
  }

  return outfitId;
}

// Rate an AI-generated outfit. One rating per outfit per user — upserts.
export async function rateOutfit(
  outfitId: string,
  rating: "up" | "down",
  comment: string | null = null
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = comment?.trim();
  const { error } = await supabase
    .from("outfit_feedback")
    .upsert(
      {
        outfit_id: outfitId,
        user_id: user.id,
        rating,
        comment: trimmed || null,
      },
      { onConflict: "outfit_id,user_id" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/outfit/result/${outfitId}`);
}
