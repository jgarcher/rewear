import Link from "next/link";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";

export const metadata = { title: "Settings — ReWear" };

export default function SettingsPage() {
  // Public VAPID key is exposed to the browser via NEXT_PUBLIC_VAPID_PUBLIC_KEY.
  // If unset, the toggle shows a "not configured yet" hint.
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Profile
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Settings
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Settings.
        </h1>

        <div className="mt-8 space-y-4">
          <PushNotificationToggle vapidPublicKey={vapidPublicKey} />

          <div className="rounded-2xl border border-linen-200 bg-linen-50 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-charcoal-muted">
              More settings coming
            </p>
            <p className="mt-2 text-sm text-charcoal-soft">
              Notification timing, quiet hours, theme, data export. For now,
              update your name + photo from Profile → Edit profile, and sign
              out from the Profile screen.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
