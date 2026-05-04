"use client";

import { useEffect, useState, useTransition } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "@/app/profile/push-actions";

type Props = {
  vapidPublicKey: string | null; // null when env not configured
};

type State =
  | "loading"
  | "unsupported"
  | "denied"
  | "off"
  | "on"
  | "registering";

// Convert a base64-url string into the ArrayBuffer format PushManager expects.
function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export function PushNotificationToggle({ vapidPublicKey }: Props) {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Detect support + current subscription state on mount
  useEffect(() => {
    async function detect() {
      if (typeof window === "undefined") return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }

      try {
        if (Notification.permission === "denied") {
          setState("denied");
          return;
        }
        // Check if already subscribed
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch (e) {
        setState("off");
        console.warn("Push detect failed:", e);
      }
    }
    detect();
  }, []);

  async function turnOn() {
    if (!vapidPublicKey) {
      setError(
        "Push isn't configured on the server yet — VAPID keys missing."
      );
      return;
    }
    setError(null);
    setState("registering");
    try {
      // Register the service worker
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      // Wait for it to become active so we can subscribe
      if (reg.installing || reg.waiting) {
        await new Promise<void>((resolve) => {
          const sw = reg.installing ?? reg.waiting;
          if (!sw) return resolve();
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") resolve();
          });
          // Safety timeout
          setTimeout(resolve, 5000);
        });
      }
      // Ask permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      // Subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(vapidPublicKey),
      });
      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      // Persist server-side
      startTransition(async () => {
        try {
          await subscribeToPush(subJson, navigator.userAgent);
          setState("on");
        } catch (e) {
          setState("off");
          setError(e instanceof Error ? e.message : "Couldn't save");
          // Best-effort: roll back the local subscription so the user can retry
          try {
            await sub.unsubscribe();
          } catch {}
        }
      });
    } catch (e) {
      setState("off");
      setError(e instanceof Error ? e.message : "Couldn't turn on");
    }
  }

  async function turnOff() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        startTransition(async () => {
          try {
            await unsubscribeFromPush(endpoint);
          } catch (e) {
            console.warn("Server unsubscribe failed:", e);
          }
          setState("off");
        });
      } else {
        setState("off");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't turn off");
    }
  }

  // Render
  return (
    <div className="rounded-2xl border border-linen-200 bg-linen-50 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Notifications
        </p>
        {state === "on" && (
          <span className="text-xs font-medium text-forest-700">On ✓</span>
        )}
      </div>

      {state === "loading" && (
        <p className="mt-3 text-sm text-charcoal-muted">Checking…</p>
      )}

      {state === "unsupported" && (
        <p className="mt-3 text-sm text-charcoal-soft">
          This browser doesn&apos;t support push notifications. On iPhone, push
          only works once you&apos;ve added ReWear to your home screen.
        </p>
      )}

      {state === "denied" && (
        <div className="mt-3 space-y-2 text-sm text-charcoal-soft">
          <p>
            You blocked notifications for this site. Re-enable them in your
            browser&apos;s site settings, then come back here to turn them on.
          </p>
        </div>
      )}

      {(state === "off" || state === "registering") && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-charcoal-soft">
            Get a ping when a friend asks to borrow, when your loans get
            approved, or when an item comes back.
          </p>
          <button
            type="button"
            onClick={turnOn}
            disabled={state === "registering" || pending || !vapidPublicKey}
            className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
          >
            {state === "registering"
              ? "Setting up…"
              : "Turn on notifications"}
          </button>
          {!vapidPublicKey && (
            <p className="text-xs text-charcoal-muted">
              Server isn&apos;t configured yet — VAPID keys need to be set in
              the deploy environment.
            </p>
          )}
        </div>
      )}

      {state === "on" && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-charcoal-soft">
            You&apos;ll get a notification on this device when something
            happens — borrow requests, approvals, returns.
          </p>
          <button
            type="button"
            onClick={turnOff}
            disabled={pending}
            className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-medium text-charcoal-soft transition-colors hover:border-error hover:text-error disabled:opacity-60"
          >
            Turn off
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-error">{error}</p>}
    </div>
  );
}
