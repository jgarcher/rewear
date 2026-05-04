"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Create a new set containing the given item plus partner items.
// Returns the new set id.
export async function createPair(
  primaryItemId: string,
  partnerItemIds: string[],
  name: string | null = null
): Promise<{ setId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const allIds = Array.from(
    new Set([primaryItemId, ...partnerItemIds].filter(Boolean))
  );
  if (allIds.length < 2) {
    throw new Error("Pick at least one other item to pair with");
  }

  // Verify all items belong to the user (defence in depth — RLS already enforces)
  const { data: items, error: itemErr } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("user_id", user.id)
    .in("id", allIds);
  if (itemErr) throw new Error(itemErr.message);
  if ((items ?? []).length !== allIds.length) {
    throw new Error("One or more items aren't in your wardrobe");
  }

  // Create the set
  const { data: created, error: setErr } = await supabase
    .from("item_sets")
    .insert({ user_id: user.id, name: name?.trim() || null })
    .select("id")
    .single();
  if (setErr || !created) throw new Error(setErr?.message ?? "Couldn't create");

  // Insert junction rows
  const rows = allIds.map((item_id) => ({
    set_id: created.id,
    item_id,
  }));
  const { error: linkErr } = await supabase
    .from("item_set_items")
    .insert(rows);
  if (linkErr) {
    // Clean up the orphan set
    await supabase.from("item_sets").delete().eq("id", created.id);
    throw new Error(linkErr.message);
  }

  revalidatePath(`/wardrobe/${primaryItemId}`);
  for (const id of partnerItemIds) {
    revalidatePath(`/wardrobe/${id}`);
  }
  return { setId: created.id };
}

export async function deleteSet(setId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Get items in the set so we can revalidate their pages
  const { data: links } = await supabase
    .from("item_set_items")
    .select("item_id")
    .eq("set_id", setId);
  const itemIds = (links ?? []).map((l) => l.item_id);

  const { error } = await supabase
    .from("item_sets")
    .delete()
    .eq("id", setId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  for (const id of itemIds) {
    revalidatePath(`/wardrobe/${id}`);
  }
}
