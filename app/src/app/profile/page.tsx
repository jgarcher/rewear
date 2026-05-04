import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateImpact, formatImpact } from "@/lib/impact";

export const metadata = { title: "Profile — ReWear" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Profile + stats — kick off in parallel
  const [
    profileRes,
    itemCountRes,
    lentOutRes,
    borrowingRes,
    friendCountRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, streak_count, lifetime_rewears")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("lent_to_user_id", "is", null),
    supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("lent_to_user_id", user.id),
    supabase
      .from("connections")
      .select("friend_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  const itemCount = itemCountRes.count ?? 0;
  const lentOutCount = lentOutRes.count ?? 0;
  const borrowingCount = borrowingRes.count ?? 0;
  const friendCount = friendCountRes.count ?? 0;
  const rewears = profile?.lifetime_rewears ?? 0;
  const streak = profile?.streak_count ?? 0;
  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "You";
  const initial = (displayName[0] ?? "?").toUpperCase();
  const impact = calculateImpact(rewears);
  const formatted = formatImpact(impact);

  const stats = [
    { label: "Items", value: itemCount.toString() },
    { label: "Re-wears", value: rewears.toString() },
    { label: "Streak", value: streak.toString() },
    { label: "Friends", value: friendCount.toString() },
    { label: "Lending out", value: lentOutCount.toString() },
    { label: "Borrowing", value: borrowingCount.toString() },
  ];

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-linen-200 ring-1 ring-linen-300">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-medium text-charcoal-muted">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Profile
            </p>
            <h1 className="mt-1 truncate font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-1 truncate text-sm text-charcoal-muted">
              {user.email}
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="hidden shrink-0 rounded-full border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700 sm:block"
          >
            Edit
          </Link>
        </div>

        {/* Edit button (mobile) */}
        <Link
          href="/profile/edit"
          className="mt-5 block rounded-xl border border-linen-200 bg-linen-50 px-4 py-3 text-center text-sm font-medium text-charcoal transition-colors hover:border-forest-500 sm:hidden"
        >
          Edit profile
        </Link>

        {/* Stats grid */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center"
            >
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                {s.label}
              </p>
              <p className="mt-1 font-heading text-2xl font-medium text-charcoal">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Impact */}
        <div className="mt-6 rounded-2xl border border-sage-100 bg-sage-100/40 p-6">
          <p className="text-xs uppercase tracking-wider text-sage-600">
            Impact this year
          </p>
          {rewears > 0 ? (
            <p className="mt-2 text-base text-charcoal sm:text-lg">
              <span className="font-medium">{formatted.delayed}</span>{" "}
              {Math.round(impact.garments_delayed) === 1
                ? "garment"
                : "garments"}{" "}
              delayed ·{" "}
              <span className="font-medium">{formatted.water}</span> water ·{" "}
              <span className="font-medium">{formatted.co2}</span> CO₂
            </p>
          ) : (
            <p className="mt-2 text-base text-charcoal-soft sm:text-lg">
              Log your first outfit and we&apos;ll start counting.
            </p>
          )}
          <Link
            href="/methodology"
            className="mt-3 inline-block text-xs text-charcoal-muted hover:text-forest-700"
          >
            See how we calculate this →
          </Link>
        </div>

        {/* Navigation */}
        <div className="mt-12 space-y-3">
          <Link
            href="/profile/history"
            className="flex items-center justify-between rounded-xl border border-linen-200 bg-linen-50 px-6 py-4 text-charcoal transition-colors hover:border-forest-500"
          >
            <span>Outfit history</span>
            <span aria-hidden className="text-charcoal-muted">
              →
            </span>
          </Link>
          <Link
            href="/friends"
            className="flex items-center justify-between rounded-xl border border-linen-200 bg-linen-50 px-6 py-4 text-charcoal transition-colors hover:border-forest-500"
          >
            <span>Friends &amp; loans</span>
            <span aria-hidden className="text-charcoal-muted">
              →
            </span>
          </Link>
          <Link
            href="/profile/settings"
            className="flex items-center justify-between rounded-xl border border-linen-200 bg-linen-50 px-6 py-4 text-charcoal transition-colors hover:border-forest-500"
          >
            <span>Settings</span>
            <span aria-hidden className="text-charcoal-muted">
              →
            </span>
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
