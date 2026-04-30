import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { wearOutfitAction, shuffleOutfitAction } from "@/app/outfit/actions";

export const metadata = { title: "Outfit — ReWear" };

export default async function OutfitResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch outfit
  const { data: outfit, error } = await supabase
    .from("outfits")
    .select("id, occasion, weather, ai_reasoning, worn_date, source")
    .eq("id", id)
    .single();

  if (error || !outfit) notFound();

  // Fetch outfit items (the join), then hydrate each with wardrobe data
  const { data: outfitItems } = await supabase
    .from("outfit_items")
    .select("item_id, role")
    .eq("outfit_id", id);

  const itemIds = (outfitItems ?? []).map((oi) => oi.item_id);
  const { data: wardrobeItems } = itemIds.length
    ? await supabase
        .from("wardrobe_items")
        .select("id, name, photo_url, category, brand")
        .in("id", itemIds)
    : { data: [] };

  const itemsById = new Map(
    (wardrobeItems ?? []).map((w) => [w.id, w] as const)
  );

  const items = (outfitItems ?? [])
    .map((oi) => {
      const w = itemsById.get(oi.item_id);
      if (!w) return null;
      return {
        id: w.id,
        name: w.name as string,
        photo_url: w.photo_url as string | null,
        category: w.category as string,
        brand: w.brand as string | null,
        role: oi.role as string,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const isFallback = items.length === 0;
  const alreadyWorn = !!outfit.worn_date;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/outfit"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Build a different one
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Today's outfit
        </p>

        <div className="mt-3 flex items-baseline justify-between gap-4">
          <h1 className="font-heading text-2xl font-medium tracking-tight text-charcoal sm:text-3xl">
            {outfit.occasion ?? "Today"} ·{" "}
            <span className="text-charcoal-muted">{outfit.weather}</span>
          </h1>
        </div>

        {isFallback ? (
          <div className="mt-10 rounded-3xl border border-linen-200 bg-linen-50 p-10 text-center">
            <p className="text-base leading-relaxed text-charcoal-soft sm:text-lg">
              {outfit.ai_reasoning ||
                "We couldn't put one together this time. Try a different occasion?"}
            </p>
            <Link
              href="/outfit"
              className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Try again
            </Link>
          </div>
        ) : (
          <>
            {/* Item grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/wardrobe/${item.id}`}
                  className="group block overflow-hidden rounded-2xl border border-linen-200 bg-linen-50"
                >
                  <div className="relative aspect-square w-full bg-linen-200">
                    {item.photo_url ? (
                      <Image
                        src={item.photo_url}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}
                    <span className="absolute left-2 top-2 rounded-full bg-forest-500/90 px-2 py-0.5 text-xs uppercase tracking-wide text-linen-100">
                      {item.role}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {item.name}
                    </p>
                    {item.brand && (
                      <p className="mt-0.5 truncate text-xs text-charcoal-muted">
                        {item.brand}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* AI reasoning — voice block */}
            {outfit.ai_reasoning && (
              <div className="mt-8 rounded-2xl border border-forest-100 bg-forest-50 px-6 py-5">
                <p className="font-heading text-lg leading-relaxed text-charcoal sm:text-xl">
                  {outfit.ai_reasoning}
                </p>
              </div>
            )}

            {/* Action row */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {alreadyWorn ? (
                <p className="flex-1 rounded-full bg-sage-100/60 px-6 py-3 text-center text-sm text-sage-600">
                  Logged as worn ✓
                </p>
              ) : (
                <form action={wearOutfitAction} className="flex-1">
                  <input type="hidden" name="outfit_id" value={outfit.id} />
                  <button
                    type="submit"
                    className="w-full rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
                  >
                    Wear this today
                  </button>
                </form>
              )}

              <form action={shuffleOutfitAction}>
                <input
                  type="hidden"
                  name="previous_outfit_id"
                  value={outfit.id}
                />
                <button
                  type="submit"
                  className="w-full rounded-full border border-charcoal/15 px-6 py-3 text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
                >
                  Shuffle
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
