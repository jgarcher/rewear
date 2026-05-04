import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateImpact, formatImpact } from "@/lib/impact";
import { LogOutfitWidget } from "@/components/LogOutfitWidget";
import type { WardrobeItem } from "@/lib/types";

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

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Profile (streak + lifetime rewears)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_count, lifetime_rewears, last_logged_date")
    .eq("user_id", user.id)
    .single();

  // Active wardrobe — own items + items currently borrowed (drives the Log Outfit sheet)
  const [{ data: ownedRaw }, { data: borrowedRaw }] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("lent_to_user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const items = [
    ...((borrowedRaw ?? []) as WardrobeItem[]),
    ...((ownedRaw ?? []) as WardrobeItem[]),
  ];

  // Wear logs for today and yesterday — to power the widget context
  const { data: recentLogs } = await supabase
    .from("wear_log")
    .select("item_id, worn_date")
    .eq("user_id", user.id)
    .in("worn_date", [today, yesterday]);

  const itemMap = new Map(items.map((i) => [i.id, i]));
  const wornTodayItems: WardrobeItem[] = [];
  const wornYesterdayItems: WardrobeItem[] = [];
  const seenToday = new Set<string>();
  const seenYesterday = new Set<string>();
  for (const log of recentLogs ?? []) {
    const it = itemMap.get(log.item_id);
    if (!it) continue;
    if (log.worn_date === today && !seenToday.has(it.id)) {
      seenToday.add(it.id);
      wornTodayItems.push(it);
    } else if (log.worn_date === yesterday && !seenYesterday.has(it.id)) {
      seenYesterday.add(it.id);
      wornYesterdayItems.push(it);
    }
  }

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
  const loggedToday = profile?.last_logged_date === today;
  const streakActive =
    profile?.last_logged_date === today ||
    profile?.last_logged_date === yesterday;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Greeting */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
            Today
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
            {greeting()}, {name}.
          </h1>
        </div>

        {/* Log Outfit Widget — the daily ritual, hero of the home page */}
        <div className="mt-8">
          {items.length === 0 ? (
            <section className="rounded-3xl border border-linen-200 bg-linen-50 p-8 sm:p-10">
              <p className="text-xs uppercase tracking-wider text-forest-500">
                First, your closet
              </p>
              <p className="mt-3 font-heading text-2xl font-medium text-charcoal sm:text-3xl">
                Add a few pieces and you can start logging your outfits.
              </p>
              <p className="mt-3 text-base text-charcoal-soft">
                Three to five items is enough to get rolling.
              </p>
              <Link
                href="/wardrobe/add"
                className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Add your first piece
              </Link>
            </section>
          ) : (
            <LogOutfitWidget
              streak={streak}
              streakActive={streakActive}
              loggedToday={loggedToday}
              wardrobe={items}
              wornTodayItems={wornTodayItems}
              wornYesterdayItems={wornYesterdayItems}
            />
          )}
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Items
            </p>
            <p className="mt-1 font-heading text-2xl font-medium text-charcoal">
              {items.length}
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
              Log your first outfit and we&apos;ll start counting.
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
