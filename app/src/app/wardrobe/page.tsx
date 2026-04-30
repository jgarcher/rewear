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

  const { data: items } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const filtered = category
    ? (items ?? []).filter((i) => i.category === category)
    : items ?? [];

  // Wear counts per item
  const ids = filtered.map((i: WardrobeItem) => i.id);
  let wearCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: wears } = await supabase
      .from("wear_log")
      .select("item_id")
      .in("item_id", ids);
    wearCounts = (wears ?? []).reduce<Record<string, number>>((acc, w) => {
      acc[w.item_id] = (acc[w.item_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const categoryKeys = Object.keys(CATEGORY_LABELS) as ItemCategory[];

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Wardrobe
            </p>
            <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              {(items ?? []).length === 0
                ? "Empty closet."
                : `${(items ?? []).length} ${(items ?? []).length === 1 ? "piece" : "pieces"}.`}
            </h1>
          </div>
          <Link
            href="/wardrobe/add"
            className="hidden rounded-full bg-forest-500 px-5 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 sm:block"
          >
            + Add
          </Link>
        </div>

        {/* Category filter */}
        {(items ?? []).length > 0 && (
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
            {filtered.map((item: WardrobeItem) => (
              <ItemCard
                key={item.id}
                item={item}
                wearCount={wearCounts[item.id] ?? 0}
              />
            ))}
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
