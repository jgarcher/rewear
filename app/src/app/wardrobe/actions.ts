"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
