"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "profile-photos";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

// Translate raw Postgres / Supabase Storage errors into copy a user can act on.
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("avatar_url") &&
    (m.includes("does not exist") || m.includes("could not find"))
  ) {
    return "Database not migrated yet — run migration 0005 in Supabase, then try again.";
  }
  if (m.includes("bucket not found") || m.includes("profile-photos")) {
    return "Photo storage not set up yet — run migration 0005 in Supabase, then try again.";
  }
  if (m.includes("row level security") || m.includes("rls")) {
    return "Permission error — sign out and back in, then retry.";
  }
  return message;
}

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
      throw new Error(friendlyError(uploadErr.message));
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust in the URL so the new image displays immediately.
    avatarUrl = `${publicUrl}?v=${Date.now()}`;
  }

  const updatePayload: {
    display_name: string;
    avatar_url?: string;
    updated_at: string;
  } = {
    display_name: displayName,
    updated_at: new Date().toISOString(),
  };
  if (avatarUrl) updatePayload.avatar_url = avatarUrl;

  const { error: updErr } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", user.id);

  if (updErr) {
    // If avatar_url column is missing, retry without it so name still saves.
    const msg = updErr.message.toLowerCase();
    const columnMissing =
      msg.includes("avatar_url") &&
      (msg.includes("does not exist") || msg.includes("could not find"));

    if (columnMissing && !avatarUrl) {
      const { error: retryErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (retryErr) throw new Error(friendlyError(retryErr.message));
    } else {
      throw new Error(friendlyError(updErr.message));
    }
  }

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

  // Best-effort: bucket may not exist if migration 0005 hasn't run
  try {
    const { data: files } = await supabase.storage.from(BUCKET).list(user.id);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch {
    // Swallow storage errors — the avatar_url cleanup is the primary state
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) throw new Error(friendlyError(error.message));

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/friends");
}
