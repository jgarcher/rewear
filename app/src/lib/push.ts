// Server-only helper for sending web push notifications.
//
// Reads VAPID config from env. If VAPID is not configured, sendPushToUser
// becomes a no-op so the app keeps working in environments without push.
//
// Run once locally to generate VAPID keys:
//   npx web-push generate-vapid-keys
// Then add to Vercel project env vars:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (also exposed to the browser)
//   VAPID_PRIVATE_KEY             (server only)
//   VAPID_SUBJECT                 (e.g. mailto:hello@rewear.app)

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@rewear.app";
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // deep link clicked from the notification
  tag?: string; // collapses earlier notifications with the same tag
};

// Send a push to every device this user has registered. Best-effort —
// failures (expired endpoints etc.) are silently dropped so callers
// can fire-and-forget. Returns the number of devices we successfully
// sent to.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!ensureVapid()) {
    // No-op when VAPID isn't configured (e.g. local dev without keys)
    return 0;
  }

  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return 0;

  const json = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        json,
        { TTL: 60 * 60 * 24 } // 24h
      )
    )
  );

  // Drop expired/invalid subscriptions
  const expiredIds: string[] = [];
  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      sent++;
      return;
    }
    const err = r.reason as { statusCode?: number } | undefined;
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      expiredIds.push(subs[i].id);
    } else {
      // Don't bother logging in production — this fires on every borrow event
      console.warn("Push send failed:", err);
    }
  });

  if (expiredIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }

  // Update last_used_at for delivered subs
  const sentIds = subs
    .filter((_, i) => results[i].status === "fulfilled")
    .map((s) => s.id);
  if (sentIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .in("id", sentIds);
  }

  return sent;
}
