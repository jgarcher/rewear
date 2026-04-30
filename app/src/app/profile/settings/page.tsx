import Link from "next/link";
import { EmptyShell } from "@/components/EmptyShell";

export const metadata = { title: "Settings — ReWear" };

export default function SettingsPage() {
  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
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
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
          Settings.
        </h1>

        <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 p-10 text-center">
          <p className="text-base leading-relaxed text-charcoal-soft sm:text-lg">
            Display name, notifications, theme, data export. Coming soon — for
            now, sign out from the Profile screen.
          </p>
        </div>
      </div>
    </main>
  );
}
