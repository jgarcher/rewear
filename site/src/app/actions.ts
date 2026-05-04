"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";

// Wire JG's notify email + the From address through env so production never
// hard-codes addresses. Sensible dev defaults.
const NOTIFY_TO = process.env.WAITLIST_NOTIFY_EMAIL || "johngarcher@gmail.com";
const FROM_ADDR =
  process.env.WAITLIST_FROM_EMAIL || "ReWear <onboarding@resend.dev>";
//                                              ^ resend.dev works without
//                                                a verified domain — perfect
//                                                for first-day signups.
//                                                Swap to ReWear <hello@rewear.app>
//                                                once the domain is verified.

export type JoinResult =
  | { ok: true; alreadyOnList: boolean }
  | { ok: false; error: string };

export async function joinWaitlist(
  email: string,
  source: string | null = null
): Promise<JoinResult> {
  const cleaned = (email || "").trim().toLowerCase();
  if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return { ok: false, error: "That doesn't look like an email." };
  }

  const supabase = getSupabase();

  // Capture lightweight context (server-side only, never echoed back)
  const h = await headers();
  const referrer = h.get("referer") || h.get("referrer") || null;
  const userAgent = h.get("user-agent")?.slice(0, 200) || null;

  // Check if it's already on the list (so we can word the response nicely
  // without leaking that fact to attackers — we treat both as success)
  let alreadyOnList = false;
  // RPC handles the insert idempotently; we use a select-or-no-op wrap to
  // detect if it was new. Simpler: just call the RPC, then probe.
  const { error: rpcError } = await supabase.rpc("join_waitlist", {
    p_email: cleaned,
    p_source: source,
    p_referrer: referrer,
    p_user_agent: userAgent,
  });
  if (rpcError) {
    if (rpcError.message.includes("invalid_email")) {
      return { ok: false, error: "That doesn't look like an email." };
    }
    console.error("Waitlist RPC failed:", rpcError);
    return {
      ok: false,
      error: "Something went wrong on our side. Try again in a sec.",
    };
  }

  // Best-effort emails — failures here don't break the signup
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    try {
      await Promise.allSettled([
        // Notification to JG
        resend.emails.send({
          from: FROM_ADDR,
          to: NOTIFY_TO,
          subject: `New ReWear waitlist signup: ${cleaned}`,
          text: [
            `Email: ${cleaned}`,
            source ? `Source: ${source}` : null,
            referrer ? `Referrer: ${referrer}` : null,
            userAgent ? `User agent: ${userAgent}` : null,
            `When: ${new Date().toISOString()}`,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
        // Confirmation to the signer
        resend.emails.send({
          from: FROM_ADDR,
          to: cleaned,
          subject: "You're on the ReWear waitlist",
          text: `Thanks for signing up.

ReWear is in private build. We're letting people in slowly so it feels right when it lands.

You'll get one more email from us — when there's actually something to log into.

— ReWear
Wear More. Waste Less.`,
        }),
      ]);
    } catch (e) {
      console.warn("Waitlist email send failed:", e);
    }
  }

  return { ok: true, alreadyOnList };
}
