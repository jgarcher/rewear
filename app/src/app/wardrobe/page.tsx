import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/ItemCard";
import { CATEGORY_LABELS } from "@/lib/types";
import type { ItemCategory, WardrobeItem } from "@/lib/types";

export const metadata = { title: "Wardrobe — ReWear" };

type SearchParams = Promise<{ category?: ItemCategory }>;

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: ownedItems }, { data: borrowedItems }] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    // Items currently lent TO me — visible thanks to the friend RLS policy
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("lent_to_user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const owned = (ownedItems ?? []) as WardrobeItem[];
  const borrowed = (borrowedItems ?? []) as WardrobeItem[];

  // Resolve owner names for borrowed items
  const ownerIds = Array.from(new Set(borrowed.map((b) => b.user_id)));
  const ownerNames = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", ownerIds);
    for (const p of profs ?? []) {
      ownerNames.set(p.user_id, p.display_name ?? "Friend");
    }
  }

  // Combined list (borrowed first so the green-outline ones get attention)
  const all: WardrobeItem[] = [...borrowed, ...owned];
  const filtered = category
    ? all.filter((i) => i.category === category)
    : all;

  // Wear counts (owned items only — borrowed wear stats live on owner's side)
  const ownedIds = filtered.filter((i) => !ownerNames.has(i.user_id)).map((i) => i.id);
  let wearCounts: Record<string, number> = {};
  if (ownedIds.length > 0) {
    const { data: wears } = await supabase
      .from("wear_log")
      .select("item_id")
      .eq("user_id", user.id)
      .in("item_id", ownedIds);
    wearCounts = (wears ?? []).reduce<Record<string, number>>((acc, w) => {
      acc[w.item_id] = (acc[w.item_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const categoryKeys = Object.keys(CATEGORY_LABELS) as ItemCategory[];
  const totalCount = all.length;
  const ownedCount = owned.length;
  const borrowedCount = borrowed.length;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Wardrobe
            </p>
            <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              {totalCount === 0
                ? "Empty closet."
                : `${totalCount} ${totalCount === 1 ? "piece" : "pieces"}.`}
            </h1>
            {borrowedCount > 0 && (
              <p className="mt-2 text-sm text-charcoal-soft">
                {ownedCount} yours · {borrowedCount} borrowed
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/schedule"
              className="rounded-full border border-charcoal/15 px-4 py-3 text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
            >
              Plan ahead
            </Link>
            <Link
              href="/wardrobe/add"
              className="hidden rounded-full bg-forest-500 px-5 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 sm:block"
            >
              + Add
            </Link>
          </div>
        </div>

        {/* Category filter */}
        {totalCount > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/wardrobe"
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                !category
                  ? "border-forest-500 bg-forest-500 text-linen-100"
                  : "border-linen-300 bg-linen-50 text-charcoal-soft hover:border-forest-500"
              }`}
            >
              All
            </Link>
            {categoryKeys.map((k) => (
              <Link
                key={k}
                href={`/wardrobe?category=${k}`}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  category === k
                    ? "border-forest-500 bg-forest-500 text-linen-100"
                    : "border-linen-300 bg-linen-50 text-charcoal-soft hover:border-forest-500"
                }`}
              >
                {CATEGORY_LABELS[k]}
              </Link>
            ))}
          </div>
        )}

        {/* Grid or empty state */}
        {filtered.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-linen-200 bg-linen-50 p-12 text-center">
            <p className="font-heading text-2xl font-medium text-charcoal">
              {category
                ? `Nothing in your closet under "${CATEGORY_LABELS[category]}".`
                : "Your closet's empty."}
            </p>
            <p className="mt-3 text-base text-charcoal-soft">
              {category
                ? "Try a different filter, or add something."
                : "Let's add your first piece."}
            </p>
            <Link
              href="/wardrobe/add"
              className="mt-8 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Add a piece
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item: WardrobeItem) => {
              const borrowedFrom = ownerNames.get(item.user_id) ?? null;
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  wearCount={wearCounts[item.id] ?? 0}
                  borrowedFrom={borrowedFrom}
                />
              );
            })}
          </div>
        )}

        {/* Mobile FAB */}
        <Link
          href="/wardrobe/add"
          className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-forest-500 text-2xl text-linen-100 shadow-lg transition-colors hover:bg-forest-600 sm:hidden"
          aria-label="Add item"
        >
          +
        </Link>
      </div>
    </main>
  );
}
