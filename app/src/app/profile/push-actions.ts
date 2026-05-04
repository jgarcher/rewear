"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(
  subscription: SubscriptionPayload,
  userAgent: string | null = null
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    throw new Error("Invalid push subscription");
  }

  // Upsert on endpoint — same device re-subscribes cleanly
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent?.slice(0, 200) || null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
  if (error) throw new Error(error.message);

  revalidatePath("/profile/settings");
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);

  revalidatePath("/profile/settings");
}
