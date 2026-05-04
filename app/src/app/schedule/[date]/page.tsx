import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchedulePlanner } from "@/components/SchedulePlanner";
import type { WardrobeItem } from "@/lib/types";

export const metadata = { title: "Plan a day — ReWear" };

type Params = Promise<{ date: string }>;

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00");
  return !Number.isNaN(d.getTime());
}

function formatDayLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function PlannerPage({ params }: { params: Params }) {
  const { date } = await params;
  if (!isValidDate(date)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;
  const isPast = date < today;

  // Existing scheduled outfit on this date (most recent unworn)
  const { data: existingOutfits } = await supabase
    .from("outfits")
    .select("id, name, worn_date")
    .eq("user_id", user.id)
    .eq("scheduled_date", date)
    .order("created_at", { ascending: false })
    .limit(1);
  const existing = existingOutfits?.[0] ?? null;

  let initialItemIds: string[] = [];
  if (existing) {
    const { data: links } = await supabase
      .from("outfit_items")
      .select("item_id")
      .eq("outfit_id", existing.id);
    initialItemIds = (links ?? []).map((l) => l.item_id);
  }

  // Available items: own + borrowed (currently lent to me)
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
  const owned = (ownedRaw ?? []) as WardrobeItem[];
  const borrowed = (borrowedRaw ?? []) as WardrobeItem[];

  // Resolve owner names for borrowed items
  const ownerNames: Record<string, string> = {};
  if (borrowed.length > 0) {
    const ownerIds = Array.from(new Set(borrowed.map((b) => b.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", ownerIds);
    const nameById = new Map(
      (profs ?? []).map((p) => [p.user_id, p.display_name ?? "Friend"])
    );
    for (const b of borrowed) {
      ownerNames[b.id] = nameById.get(b.user_id) ?? "Friend";
    }
  }

  const items = [...borrowed, ...owned];

  // Wear-frequency map: wears in last 7 days + scheduled in next 7 days,
  // excluding the current outfit being edited so re-saving with the same
  // pieces doesn't double-count them as "in rotation".
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  const sevenDaysFromNow = new Date(Date.now() + 6 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [{ data: weekLogs }, { data: futureScheduled }] = await Promise.all([
    supabase
      .from("wear_log")
      .select("item_id")
      .eq("user_id", user.id)
      .gte("worn_date", sevenDaysAgo),
    supabase
      .from("outfits")
      .select("id")
      .eq("user_id", user.id)
      .gte("scheduled_date", today)
      .lte("scheduled_date", sevenDaysFromNow)
      .is("worn_date", null),
  ]);

  const recentUseByItemId: Record<string, number> = {};
  for (const l of weekLogs ?? []) {
    recentUseByItemId[l.item_id] = (recentUseByItemId[l.item_id] ?? 0) + 1;
  }
  const futureScheduledIds = (futureScheduled ?? [])
    .map((o) => o.id)
    .filter((id) => id !== existing?.id); // exclude current edit
  if (futureScheduledIds.length > 0) {
    const { data: futureLinks } = await supabase
      .from("outfit_items")
      .select("item_id")
      .in("outfit_id", futureScheduledIds);
    for (const l of futureLinks ?? []) {
      recentUseByItemId[l.item_id] = (recentUseByItemId[l.item_id] ?? 0) + 1;
    }
  }

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/schedule"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Schedule
        </Link>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
            {isToday ? "Today" : isPast ? "Past day" : "Plan ahead"}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
            {formatDayLong(date)}
          </h1>
          {existing?.worn_date && (
            <p className="mt-2 text-sm text-sage-600">
              Worn ✓ on {existing.worn_date}
            </p>
          )}
        </div>

        <div className="mt-8">
          <SchedulePlanner
            scheduledDate={date}
            isToday={isToday}
            initialName={existing?.name ?? ""}
            initialItemIds={initialItemIds}
            outfitId={existing?.id ?? null}
            alreadyWorn={!!existing?.worn_date}
            items={items}
            borrowedOwnerNames={ownerNames}
            recentUseByItemId={recentUseByItemId}
          />
        </div>
      </div>
    </main>
  );
}
