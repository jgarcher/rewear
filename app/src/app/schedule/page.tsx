import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TripPlannerForm } from "@/components/TripPlannerForm";
import type { WardrobeItem } from "@/lib/types";

export const metadata = { title: "Schedule — ReWear" };

type SearchParams = Promise<{ from?: string; to?: string }>;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDayLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDayShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isValidDate(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from, to } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = isoDate(new Date());
  const isRange = isValidDate(from) && isValidDate(to) && from <= to;

  // Date window:
  //  - If a holiday range is requested: from..to
  //  - Otherwise: today + next 13 days (14 day rolling view)
  const startDate = isRange ? from! : today;
  const endDate = isRange
    ? to!
    : isoDate(new Date(Date.now() + 13 * 86400000));

  // Fetch scheduled outfits in the window
  const { data: outfits } = await supabase
    .from("outfits")
    .select("id, name, scheduled_date, worn_date, ai_reasoning")
    .eq("user_id", user.id)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true });

  const outfitIds = (outfits ?? []).map((o) => o.id);

  // Fetch their items
  const itemsByOutfit = new Map<string, WardrobeItem[]>();
  if (outfitIds.length > 0) {
    const { data: links } = await supabase
      .from("outfit_items")
      .select("outfit_id, item_id")
      .in("outfit_id", outfitIds);
    const itemIds = Array.from(
      new Set((links ?? []).map((l) => l.item_id))
    );
    const { data: items } = itemIds.length
      ? await supabase
          .from("wardrobe_items")
          .select("*")
          .in("id", itemIds)
      : { data: [] };
    const byId = new Map((items ?? []).map((i) => [i.id, i as WardrobeItem]));
    for (const link of links ?? []) {
      const it = byId.get(link.item_id);
      if (!it) continue;
      const arr = itemsByOutfit.get(link.outfit_id) ?? [];
      arr.push(it);
      itemsByOutfit.set(link.outfit_id, arr);
    }
  }

  // Build a date list for the window
  const dateList: string[] = [];
  {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      dateList.push(isoDate(d));
    }
  }

  // Group outfits by date
  const outfitsByDate = new Map<
    string,
    { id: string; name: string | null; items: WardrobeItem[]; worn: boolean }
  >();
  for (const o of outfits ?? []) {
    if (!o.scheduled_date) continue;
    outfitsByDate.set(o.scheduled_date, {
      id: o.id,
      name: o.name,
      items: itemsByOutfit.get(o.id) ?? [],
      worn: !!o.worn_date,
    });
  }

  // Holiday packing summary: deduplicated items across the range, with usage count
  const packingMap = new Map<string, { item: WardrobeItem; count: number }>();
  if (isRange) {
    for (const o of outfits ?? []) {
      const items = itemsByOutfit.get(o.id) ?? [];
      for (const it of items) {
        const existing = packingMap.get(it.id);
        if (existing) existing.count += 1;
        else packingMap.set(it.id, { item: it, count: 1 });
      }
    }
  }
  const packingList = Array.from(packingMap.values()).sort(
    (a, b) => b.count - a.count
  );

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Schedule
            </p>
            <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              {isRange ? "Trip planner." : "Plan ahead."}
            </h1>
            {isRange ? (
              <p className="mt-2 text-sm text-charcoal-soft">
                {formatDayShort(startDate)} → {formatDayShort(endDate)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-charcoal-soft">
                Next two weeks. Tap a day to plan an outfit.
              </p>
            )}
          </div>
          {isRange ? (
            <Link
              href="/schedule"
              className="rounded-full border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
            >
              ← All dates
            </Link>
          ) : (
            <Link
              href={`/schedule/${today}`}
              className="rounded-full bg-forest-500 px-5 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              + Plan today
            </Link>
          )}
        </div>

        {/* Holiday range form (only on the default view) */}
        {!isRange && (
          <form
            action="/schedule"
            method="GET"
            className="mt-8 rounded-3xl border border-linen-200 bg-linen-50 p-5 sm:p-6"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Plan a trip
            </p>
            <p className="mt-2 text-sm text-charcoal-soft">
              Pick start and end dates — we&apos;ll show a packing list of every
              piece you&apos;ll need across those days.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-charcoal-muted">
                  From
                </span>
                <input
                  type="date"
                  name="from"
                  defaultValue={today}
                  className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal focus:border-forest-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-charcoal-muted">
                  To
                </span>
                <input
                  type="date"
                  name="to"
                  defaultValue={isoDate(new Date(Date.now() + 6 * 86400000))}
                  className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal focus:border-forest-500 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="self-end rounded-full bg-forest-500 px-5 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Show packing list
              </button>
            </div>
          </form>
        )}

        {/* AI trip planner (range view only) */}
        {isRange && (
          <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-forest-500 to-forest-700 p-5 text-linen-100 sm:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-linen-100/70">
                AI trip planner
              </p>
            </div>
            <h2 className="mt-2 font-heading text-2xl font-medium sm:text-3xl">
              Let us plan it for you.
            </h2>
            <p className="mt-2 text-sm text-linen-100/85 sm:text-base">
              Describe the trip and we&apos;ll build an outfit for each day.
              You can edit any of them after.
            </p>
            <div className="mt-5 rounded-2xl bg-linen-50 p-4 text-charcoal sm:p-5">
              <TripPlannerForm
                from={startDate}
                to={endDate}
                numDays={dateList.length}
                numUnplanned={dateList.filter((d) => !outfitsByDate.has(d)).length}
              />
            </div>
          </section>
        )}

        {/* Packing list (range view only) */}
        {isRange && (
          <section className="mt-8 rounded-3xl border border-linen-200 bg-linen-50 p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                Packing list
              </p>
              <p className="text-xs text-charcoal-muted">
                {packingList.length}{" "}
                {packingList.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
            {packingList.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal-soft">
                Nothing scheduled in this range yet. Tap any date below to
                start.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {packingList.map(({ item, count }) => (
                  <Link
                    key={item.id}
                    href={`/wardrobe/${item.id}`}
                    className="group block overflow-hidden rounded-2xl border border-linen-200 bg-linen-100 transition-colors hover:border-forest-500"
                  >
                    <div className="relative aspect-square w-full bg-linen-200">
                      {item.photo_url ? (
                        <Image
                          src={item.photo_url}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 33vw, 25vw"
                          className="object-cover"
                        />
                      ) : null}
                      {count > 1 && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-forest-500/95 px-2 py-0.5 text-[10px] font-medium text-linen-100">
                          ×{count}
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-charcoal">
                        {item.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Day list */}
        <section className="mt-8 space-y-3">
          {dateList.map((date) => {
            const o = outfitsByDate.get(date);
            const isToday = date === today;
            return (
              <Link
                key={date}
                href={`/schedule/${date}`}
                className={`group flex items-center gap-4 rounded-2xl border bg-linen-50 p-4 transition-colors hover:border-forest-500 ${
                  o ? "border-forest-100" : "border-linen-200"
                }`}
              >
                <div className="w-32 shrink-0">
                  <p
                    className={`text-xs font-medium uppercase tracking-[0.2em] ${
                      isToday ? "text-forest-500" : "text-charcoal-muted"
                    }`}
                  >
                    {isToday ? "Today" : ""}
                  </p>
                  <p className="mt-0.5 font-heading text-base font-medium text-charcoal">
                    {formatDayShort(date)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  {o ? (
                    <>
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 5).map((it) => (
                          <div
                            key={it.id}
                            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-linen-50 bg-linen-200"
                          >
                            {it.photo_url && (
                              <Image
                                src={it.photo_url}
                                alt={it.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                        ))}
                        {o.items.length > 5 && (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-linen-50 bg-forest-500/10 text-xs font-medium text-forest-700">
                            +{o.items.length - 5}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-charcoal-soft">
                        {o.name
                          ? o.name
                          : `${o.items.length} ${
                              o.items.length === 1 ? "piece" : "pieces"
                            }`}
                        {o.worn ? " · Worn ✓" : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-charcoal-muted group-hover:text-forest-700">
                      + Plan this day
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
