"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeWardrobePhoto, type AutoTagResult } from "@/lib/anthropic";
import type { ItemCategory, Season, Occasion } from "@/lib/types";

const BUCKET = "wardrobe-photos";

// Default values for v1 quick-add — user fills these in later from item detail
const DEFAULT_SEASONS: Season[] = ["all"];
const DEFAULT_OCCASIONS: Occasion[] = ["casual"];

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Required fields
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as ItemCategory;
  const primary_colour = (formData.get("primary_colour") as string)?.trim();
  const photo = formData.get("photo") as File | null;

  if (!name || !category || !primary_colour) {
    throw new Error("Name, category, and colour are required");
  }
  if (!photo || photo.size === 0) {
    throw new Error("Please add a photo");
  }
  if (photo.size > 10 * 1024 * 1024) {
    throw new Error("Photo must be smaller than 10 MB");
  }

  // Optional fields
  const brand = ((formData.get("brand") as string) || "").trim() || null;
  const subcategory =
    ((formData.get("subcategory") as string) || "").trim() || null;
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  // Generate item ID and upload path. Path is userId/itemId.<ext>
  const itemId = crypto.randomUUID();
  const ext =
    photo.name.split(".").pop()?.toLowerCase() ||
    photo.type.split("/")[1] ||
    "jpg";
  const storagePath = `${user.id}/${itemId}.${ext}`;

  // Upload photo
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, photo, {
      contentType: photo.type,
      upsert: false,
    });
  if (uploadError) {
    console.error("Photo upload failed:", uploadError);
    throw new Error(`Photo upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Insert wardrobe item
  const { error: dbError } = await supabase.from("wardrobe_items").insert({
    id: itemId,
    user_id: user.id,
    name,
    category,
    subcategory,
    primary_colour,
    brand,
    notes,
    seasons: DEFAULT_SEASONS,
    occasions: DEFAULT_OCCASIONS,
    photo_url: publicUrl,
    status: "active",
  });

  if (dbError) {
    // Clean up the orphan photo
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("DB insert failed:", dbError);
    throw new Error(`Could not save item: ${dbError.message}`);
  }

  revalidatePath("/wardrobe");
  revalidatePath("/");
  redirect(`/wardrobe/${itemId}`);
}

export async function markAsWorn(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const today = new Date().toISOString().slice(0, 10);

  // Insert wear log entry
  const { error: wearError } = await supabase.from("wear_log").insert({
    user_id: user.id,
    item_id: itemId,
    worn_date: today,
  });
  if (wearError) throw new Error(wearError.message);

  // Update streak + lifetime_rewears on profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_count, last_logged_date, lifetime_rewears")
    .eq("user_id", user.id)
    .single();

  if (profile) {
    const last = profile.last_logged_date;
    let newStreak = profile.streak_count;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      newStreak = last === yesterday ? profile.streak_count + 1 : 1;
    }

    await supabase
      .from("profiles")
      .update({
        streak_count: newStreak,
        last_logged_date: today,
        lifetime_rewears: profile.lifetime_rewears + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${itemId}`);
  revalidatePath("/");
}

// Log a multi-item outfit for today in one shot.
// Idempotent: items already logged today are skipped. Streak only increments once per day.
// Returns enough info for the client to show a celebration.
export type LogOutfitResult = {
  addedCount: number;       // newly inserted wear_log rows
  alreadyLoggedCount: number; // items in selection that were already logged today
  newStreak: number;
  didIncrement: boolean;    // streak ticked up on this call
  milestone: 3 | 7 | 14 | 30 | 100 | null;
};

export async function logTodaysOutfit(
  itemIds: string[]
): Promise<LogOutfitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (ids.length === 0) {
    throw new Error("Pick at least one item");
  }

  const today = new Date().toISOString().slice(0, 10);

  // Find which selected items are already in wear_log for today
  const { data: existing, error: existingErr } = await supabase
    .from("wear_log")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("worn_date", today)
    .in("item_id", ids);
  if (existingErr) throw new Error(existingErr.message);

  const alreadyLogged = new Set((existing ?? []).map((w) => w.item_id));
  const newIds = ids.filter((id) => !alreadyLogged.has(id));

  // Insert new wear_log rows
  if (newIds.length > 0) {
    const rows = newIds.map((item_id) => ({
      user_id: user.id,
      item_id,
      worn_date: today,
    }));
    const { error: insertErr } = await supabase.from("wear_log").insert(rows);
    if (insertErr) throw new Error(insertErr.message);
  }

  // Streak + lifetime_rewears
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
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
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

  const milestoneSet = new Set([3, 7, 14, 30, 100]);
  const milestone =
    didIncrement && milestoneSet.has(newStreak)
      ? (newStreak as 3 | 7 | 14 | 30 | 100)
      : null;

  revalidatePath("/");
  revalidatePath("/wardrobe");

  return {
    addedCount: newIds.length,
    alreadyLoggedCount: alreadyLogged.size,
    newStreak,
    didIncrement,
    milestone,
  };
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Get the photo path before deleting
  const { data: item } = await supabase
    .from("wardrobe_items")
    .select("photo_url")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  // Delete the row (cascades to wear_log etc.)
  const { error } = await supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // Best-effort photo cleanup
  if (item?.photo_url) {
    const path = item.photo_url.split(`${BUCKET}/`)[1];
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  revalidatePath("/wardrobe");
  revalidatePath("/");
  redirect("/wardrobe");
}

// === Auto-tag flow (Session 10) ===
//
// Two-step add: client uploads photo to storage → calls analyzePhotoAction
// to run Claude vision → user reviews pre-filled form → submits saveItemAction.

export async function analyzePhotoAction(
  photoUrl: string
): Promise<AutoTagResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Validate the URL is from our bucket and from this user's folder.
  if (
    !photoUrl.includes(`/${BUCKET}/${user.id}/`) ||
    !photoUrl.startsWith("https://")
  ) {
    throw new Error("Invalid photo URL");
  }

  return await analyzeWardrobePhoto(photoUrl);
}

// Returns the saved item's id + name instead of redirecting.
// Client decides whether to navigate or stay on the add flow (rapid-add).
export async function saveItemAction(
  formData: FormData
): Promise<{ itemId: string; name: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const itemId = (formData.get("item_id") as string)?.trim();
  const photoUrl = (formData.get("photo_url") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as ItemCategory;
  const primary_colour = (formData.get("primary_colour") as string)?.trim();

  if (!itemId || !photoUrl) {
    throw new Error("Missing photo. Re-upload and try again.");
  }
  if (!name || !category || !primary_colour) {
    throw new Error("Name, category, and colour are required");
  }
  if (!photoUrl.includes(`/${BUCKET}/${user.id}/`)) {
    throw new Error("Photo doesn't belong to this account");
  }

  const subcategory =
    ((formData.get("subcategory") as string) || "").trim() || null;
  const brand = ((formData.get("brand") as string) || "").trim() || null;
  const material = ((formData.get("material") as string) || "").trim() || null;
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  const seasons = (formData.getAll("seasons") as string[]).filter(Boolean);
  const occasions = (formData.getAll("occasions") as string[]).filter(Boolean);

  const { error: dbError } = await supabase.from("wardrobe_items").insert({
    id: itemId,
    user_id: user.id,
    name,
    category,
    subcategory,
    primary_colour,
    brand,
    material,
    notes,
    seasons: seasons.length > 0 ? seasons : ["all"],
    occasions: occasions.length > 0 ? occasions : ["casual"],
    photo_url: photoUrl,
    status: "active",
  });

  if (dbError) {
    console.error("DB insert failed:", dbError);
    throw new Error(`Could not save item: ${dbError.message}`);
  }

  revalidatePath("/wardrobe");
  revalidatePath("/");
  return { itemId, name };
}

export async function updateItemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const itemId = (formData.get("item_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as ItemCategory;
  const primary_colour = (formData.get("primary_colour") as string)?.trim();

  if (!itemId) throw new Error("Missing item id");
  if (!name || !category || !primary_colour) {
    throw new Error("Name, category, and colour are required");
  }

  const subcategory =
    ((formData.get("subcategory") as string) || "").trim() || null;
  const brand = ((formData.get("brand") as string) || "").trim() || null;
  const material = ((formData.get("material") as string) || "").trim() || null;
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  const seasons = (formData.getAll("seasons") as string[]).filter(Boolean);
  const occasions = (formData.getAll("occasions") as string[]).filter(Boolean);

  const { error } = await supabase
    .from("wardrobe_items")
    .update({
      name,
      category,
      subcategory,
      primary_colour,
      brand,
      material,
      notes,
      seasons: seasons.length > 0 ? seasons : ["all"],
      occasions: occasions.length > 0 ? occasions : ["casual"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Update failed:", error);
    throw new Error(`Could not save changes: ${error.message}`);
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${itemId}`);
  redirect(`/wardrobe/${itemId}`);
}
