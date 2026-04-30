import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile — ReWear" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Profile
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
          {user?.email ?? "Signed out"}
        </h1>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Items", value: "0" },
            { label: "Re-wears", value: "0" },
            { label: "Listed", value: "0" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-linen-200 bg-linen-50 p-6 text-center"
            >
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                {s.label}
              </p>
              <p className="mt-2 font-heading text-2xl font-medium text-charcoal">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-3">
          <Link
            href="/profile/history"
            className="block rounded-xl border border-linen-200 bg-linen-50 px-6 py-4 text-charcoal transition-colors hover:border-forest-500"
          >
            Outfit history
          </Link>
          <Link
            href="/profile/settings"
            className="block rounded-xl border border-linen-200 bg-linen-50 px-6 py-4 text-charcoal transition-colors hover:border-forest-500"
          >
            Settings
          </Link>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full rounded-xl border border-linen-200 bg-linen-50 px-6 py-4 text-left text-charcoal transition-colors hover:border-error hover:text-error"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
