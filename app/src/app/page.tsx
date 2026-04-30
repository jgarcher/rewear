import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateImpact, formatImpact } from "@/lib/impact";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // proxy redirects, this is a fallback

  // Profile (streak + lifetime rewears)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_count, lifetime_rewears, last_logged_date")
    .eq("user_id", user.id)
    .single();

  // Item count (active only)
  const { count: itemCount } = await supabase
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Did You Know — pick one based on day of year so it rotates daily
  const { data: facts } = await supabase
    .from("did_you_know_facts")
    .select("*")
    .order("id");
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const fact = facts && facts.length > 0
    ? facts[dayIndex % facts.length]
    : null;

  const name =
    profile?.display_name ?? user.email?.split("@")[0] ?? "there";
  const rewears = profile?.lifetime_rewears ?? 0;
  const impact = calculateImpact(rewears);
  const formatted = formatImpact(impact);
  const streak = profile?.streak_count ?? 0;

  // Streak status
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakActive =
    profile?.last_logged_date === today ||
    profile?.last_logged_date === yesterday;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Greeting + streak */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Today
            </p>
            <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
              {greeting()}, {name}.
            </h1>
          </div>
          {streak > 0 && streakActive && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Streak
              </p>
              <p className="font-heading text-2xl font-medium text-forest-500">
                {streak} {streak === 1 ? "day" : "days"}
              </p>
            </div>
          )}
        </div>

        {/* Today's outfit placeholder */}
        <div className="mt-10 rounded-3xl border border-linen-200 bg-linen-50 p-8 sm:p-10">
          <p className="text-xs uppercase tracking-wider text-forest-500">
            Today's outfit
          </p>
          {(itemCount ?? 0) < 3 ? (
            <>
              <p className="mt-3 font-heading text-2xl font-medium text-charcoal sm:text-3xl">
                Add a few pieces and we'll start building outfits.
              </p>
              <p className="mt-3 text-base text-charcoal-soft">
                We need at least 3–5 items in your wardrobe to make sensible
                suggestions.
              </p>
              <Link
                href="/wardrobe/add"
                className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Add a piece
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 font-heading text-2xl font-medium text-charcoal sm:text-3xl">
                Pick the day, we'll pick the outfit.
              </p>
              <p className="mt-3 text-base text-charcoal-soft">
                The AI lands in Session 8. For now, head to Outfit and let us
                know what you're up to.
              </p>
              <Link
                href="/outfit"
                className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Build an outfit
              </Link>
            </>
          )}
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Items
            </p>
            <p className="mt-1 font-heading text-2xl font-medium text-charcoal">
              {itemCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Re-wears
            </p>
            <p className="mt-1 font-heading text-2xl font-medium text-charcoal">
              {rewears}
            </p>
          </div>
          <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Streak
            </p>
            <p className="mt-1 font-heading text-2xl font-medium text-charcoal">
              {streak}
            </p>
          </div>
        </div>

        {/* Impact tile */}
        <div className="mt-6 rounded-2xl border border-sage-100 bg-sage-100/40 p-6">
          <p className="text-xs uppercase tracking-wider text-sage-600">
            Impact this year
          </p>
          {rewears > 0 ? (
            <>
              <p className="mt-2 text-base text-charcoal sm:text-lg">
                <span className="font-medium">{formatted.delayed}</span>{" "}
                {Math.round(impact.garments_delayed) === 1 ? "garment" : "garments"} delayed ·{" "}
                <span className="font-medium">{formatted.water}</span> water ·{" "}
                <span className="font-medium">{formatted.co2}</span> CO₂
              </p>
              <Link
                href="/methodology"
                className="mt-2 inline-block text-xs text-charcoal-muted hover:text-forest-700"
              >
                See how we calculate this →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-base text-charcoal-soft sm:text-lg">
              Mark something as worn and we'll start counting.
            </p>
          )}
        </div>

        {/* Did You Know */}
        {fact && (
          <div className="mt-6 rounded-2xl border border-clay-100 bg-clay-100/30 p-6">
            <p className="text-xs uppercase tracking-wider text-clay-600">
              Did you know
            </p>
            <p className="mt-3 text-base leading-relaxed text-charcoal sm:text-lg">
              {fact.fact}
            </p>
            {fact.source && (
              <p className="mt-3 text-xs uppercase tracking-wider text-charcoal-muted">
                {fact.source}
                {fact.source_year ? `, ${fact.source_year}` : ""}
              </p>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          <Link
            href="/wardrobe/add"
            className="rounded-xl border border-linen-200 bg-linen-50 p-4 text-center text-sm text-charcoal transition-colors hover:border-forest-500"
          >
            Add to wardrobe
          </Link>
          <Link
            href="/wardrobe"
            className="rounded-xl border border-linen-200 bg-linen-50 p-4 text-center text-sm text-charcoal transition-colors hover:border-forest-500"
          >
            Browse closet
          </Link>
          <Link
            href="/discover"
            className="rounded-xl border border-linen-200 bg-linen-50 p-4 text-center text-sm text-charcoal transition-colors hover:border-forest-500"
          >
            Find a donation point
          </Link>
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.2em] text-charcoal-muted">
          Wear More. Waste Less.
        </p>
      </div>
    </main>
  );
}
