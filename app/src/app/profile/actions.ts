"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "profile-photos";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const displayName = ((formData.get("display_name") as string) || "").trim();
  if (displayName.length === 0) throw new Error("Name can't be empty");
  if (displayName.length > 60)
    throw new Error("Name's too long (max 60 characters)");

  const photo = formData.get("photo") as File | null;
  let avatarUrl: string | null = null;

  if (photo && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new Error("Photo must be smaller than 8 MB");
    }
    if (!photo.type.startsWith("image/")) {
      throw new Error("That doesn't look like an image");
    }

    const ext =
      photo.name.split(".").pop()?.toLowerCase() ||
      photo.type.split("/")[1] ||
      "jpg";
    // Stable filename per user — overwrites old avatar.
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, photo, {
        contentType: photo.type,
        upsert: true,
        cacheControl: "3600",
      });
    if (uploadErr) {
      throw new Error(`Photo upload failed: ${uploadErr.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust in the URL so the new image displays immediately.
    avatarUrl = `${publicUrl}?v=${Date.now()}`;
  }

  const updatePayload: { display_name: string; avatar_url?: string; updated_at: string } =
    {
      display_name: displayName,
      updated_at: new Date().toISOString(),
    };
  if (avatarUrl) updatePayload.avatar_url = avatarUrl;

  const { error: updErr } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", user.id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/friends");
}

export async function removeAvatar(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Find any avatar files in the user's folder and remove them.
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(user.id);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }

  await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/friends");
}
