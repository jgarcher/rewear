"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

// Pull display name + an item's photo URL by id; returns nulls on miss.
// Used for friendly push copy.
async function fetchPushContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  itemId: string
): Promise<{ name: string; itemName: string }> {
  const [{ data: profile }, { data: item }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .single(),
    supabase.from("wardrobe_items").select("name").eq("id", itemId).single(),
  ]);
  return {
    name: profile?.display_name ?? "Someone",
    itemName: (item?.name as string | undefined) ?? "an item",
  };
}

// ============= Helpers =============

function generateInviteCode(): string {
  // 10 chars from a 32-char alphabet — no confusing characters (no 0/O/1/I/l).
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

// ============= Invites + connections =============

export async function createInviteLink(): Promise<{ code: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Try a few times in case of (astronomically rare) collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const { error } = await supabase.from("connection_invites").insert({
      code,
      inviter_id: user.id,
    });
    if (!error) {
      revalidatePath("/friends/invite");
      return { code };
    }
    // If unique violation, loop and try a new code; otherwise bail
    if (error.code !== "23505") {
      throw new Error(error.message);
    }
  }
  throw new Error("Couldn't generate invite — try again");
}

export type InviteLookupResult =
  | { valid: true; inviter_id: string; inviter_name: string }
  | { valid: false; reason: "not_found" | "used" | "expired" };

export async function lookupInvite(code: string): Promise<InviteLookupResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_invite", {
    invite_code: code,
  });
  if (error) throw new Error(error.message);
  return data as InviteLookupResult;
}

export type AcceptInviteResult = {
  inviter_id: string;
  already_friends: boolean;
};

export async function acceptInvite(code: string): Promise<AcceptInviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase.rpc("accept_invite", {
    invite_code: code,
  });
  if (error) {
    // Postgres exception messages bubble up as messages
    throw new Error(error.message);
  }
  revalidatePath("/friends");
  return data as AcceptInviteResult;
}

export async function removeFriend(friendId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.rpc("remove_friend", {
    other_user_id: friendId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}

// ============= Borrow requests =============

export type BorrowResponseAction = "approve" | "decline";

export async function requestBorrow(
  itemId: string,
  options: {
    message?: string;
    requestedForDate?: string;
    returnBy?: string;
  } = {}
): Promise<{ requestId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Look up the item to get the owner; RLS lets us see it because we're a friend
  // (it's borrowable / up_for_grabs and we're connected).
  const { data: item, error: itemErr } = await supabase
    .from("wardrobe_items")
    .select("id, user_id, share_state, lent_to_user_id")
    .eq("id", itemId)
    .single();
  if (itemErr || !item) throw new Error("Item not found");
  if (item.user_id === user.id) throw new Error("Can't borrow your own item");
  if (item.share_state === "private")
    throw new Error("This item isn't shared");
  if (item.lent_to_user_id)
    throw new Error("This item is already lent out");

  // Don't allow duplicate pending requests from the same requester
  const { data: existing } = await supabase
    .from("borrow_requests")
    .select("id")
    .eq("item_id", itemId)
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { requestId: existing.id };
  }

  const insertPayload: {
    item_id: string;
    owner_id: string;
    requester_id: string;
    message: string | null;
    requested_for_date: string | null;
    return_by: string | null;
  } = {
    item_id: itemId,
    owner_id: item.user_id,
    requester_id: user.id,
    message: options.message?.trim() || null,
    requested_for_date: options.requestedForDate || null,
    return_by: options.returnBy || null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("borrow_requests")
    .insert(insertPayload)
    .select("id")
    .single();
  if (insertErr) throw new Error(insertErr.message);

  revalidatePath("/friends");
  revalidatePath(`/wardrobe/${itemId}`);

  // Best-effort push to the owner
  try {
    const ctx = await fetchPushContext(supabase, user.id, itemId);
    await sendPushToUser(item.user_id, {
      title: "Borrow request",
      body: `${ctx.name} wants to borrow your ${ctx.itemName}.`,
      url: `/wardrobe/${itemId}`,
      tag: `borrow-${inserted.id}`,
    });
  } catch (e) {
    console.warn("Push send failed (requestBorrow):", e);
  }

  return { requestId: inserted.id };
}

export async function respondToBorrowRequest(
  requestId: string,
  response: BorrowResponseAction
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: req, error: reqErr } = await supabase
    .from("borrow_requests")
    .select("id, item_id, owner_id, requester_id, status, return_by")
    .eq("id", requestId)
    .single();
  if (reqErr || !req) throw new Error("Request not found");
  if (req.owner_id !== user.id) throw new Error("Only the owner can respond");
  if (req.status !== "pending")
    throw new Error("This request has already been decided");

  const newStatus = response === "approve" ? "approved" : "declined";

  const { error: updErr } = await supabase
    .from("borrow_requests")
    .update({
      status: newStatus,
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (updErr) throw new Error(updErr.message);

  if (response === "approve") {
    // Mark the item as lent
    const { error: itemErr } = await supabase
      .from("wardrobe_items")
      .update({
        lent_to_user_id: req.requester_id,
        return_by: req.return_by,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.item_id)
      .eq("user_id", user.id);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/friends");
  revalidatePath(`/wardrobe/${req.item_id}`);

  // Best-effort push to the requester
  try {
    const ctx = await fetchPushContext(supabase, user.id, req.item_id);
    await sendPushToUser(req.requester_id, {
      title: response === "approve" ? "Approved 🎉" : "Borrow declined",
      body:
        response === "approve"
          ? `${ctx.name} said yes to the ${ctx.itemName}.`
          : `${ctx.name} can't lend the ${ctx.itemName} right now.`,
      url: `/wardrobe/${req.item_id}`,
      tag: `borrow-${requestId}`,
    });
  } catch (e) {
    console.warn("Push send failed (respondToBorrowRequest):", e);
  }
}

export async function cancelBorrowRequest(requestId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: req, error: reqErr } = await supabase
    .from("borrow_requests")
    .select("id, requester_id, status, item_id")
    .eq("id", requestId)
    .single();
  if (reqErr || !req) throw new Error("Request not found");
  if (req.requester_id !== user.id)
    throw new Error("Only the requester can cancel");
  if (req.status !== "pending")
    throw new Error("This request can't be cancelled now");

  const { error: updErr } = await supabase
    .from("borrow_requests")
    .update({
      status: "cancelled",
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/friends");
  revalidatePath(`/wardrobe/${req.item_id}`);
}

// Borrower-only: marks the loan as received in hand.
// Transitions approved → received, stamps received_at.
export async function markReceived(requestId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: req, error: reqErr } = await supabase
    .from("borrow_requests")
    .select("id, item_id, owner_id, requester_id, status")
    .eq("id", requestId)
    .single();
  if (reqErr || !req) throw new Error("Request not found");
  if (req.requester_id !== user.id)
    throw new Error("Only the borrower can confirm receipt");
  if (req.status !== "approved")
    throw new Error("Only approved loans can be marked received");

  const { error: updErr } = await supabase
    .from("borrow_requests")
    .update({
      status: "received",
      received_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/friends");
  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${req.item_id}`);

  // Best-effort push to the owner — "X has it now"
  try {
    const ctx = await fetchPushContext(supabase, user.id, req.item_id);
    await sendPushToUser(req.owner_id, {
      title: "In their hands",
      body: `${ctx.name} confirmed they got the ${ctx.itemName}.`,
      url: `/wardrobe/${req.item_id}`,
      tag: `borrow-${requestId}`,
    });
  } catch (e) {
    console.warn("Push send failed (markReceived):", e);
  }
}

export async function markReturned(requestId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: req, error: reqErr } = await supabase
    .from("borrow_requests")
    .select("id, item_id, owner_id, requester_id, status")
    .eq("id", requestId)
    .single();
  if (reqErr || !req) throw new Error("Request not found");
  if (req.owner_id !== user.id)
    throw new Error("Only the owner can confirm a return");
  // Accept either approved (skipped received step) or received
  if (!["approved", "received"].includes(req.status))
    throw new Error("Only active loans can be returned");

  const { error: updErr } = await supabase
    .from("borrow_requests")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (updErr) throw new Error(updErr.message);

  await supabase
    .from("wardrobe_items")
    .update({
      lent_to_user_id: null,
      return_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.item_id)
    .eq("user_id", user.id);

  revalidatePath("/friends");
  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${req.item_id}`);

  // Best-effort push to the requester — "thanks, return confirmed"
  try {
    const ctx = await fetchPushContext(supabase, user.id, req.item_id);
    await sendPushToUser(req.requester_id, {
      title: "Return confirmed",
      body: `${ctx.name} marked the ${ctx.itemName} as returned.`,
      url: "/friends",
      tag: `borrow-${requestId}`,
    });
  } catch (e) {
    console.warn("Push send failed (markReturned):", e);
  }
}
