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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
        .select("id, user_id, name, photo_url, category, brand, lent_to_user_id, share_state")
        .in("id", itemIds)
    : { data: [] };

  const itemsById = new Map(
    (wardrobeItems ?? []).map((w) => [w.id, w] as const)
  );

  // Owner display names for friend items
  const friendOwnerIds = Array.from(
    new Set(
      (wardrobeItems ?? [])
        .filter((w) => w.user_id !== user.id)
        .map((w) => w.user_id)
    )
  );
  const ownerNames = new Map<string, string>();
  if (friendOwnerIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", friendOwnerIds);
    for (const p of profs ?? []) {
      ownerNames.set(p.user_id, p.display_name ?? "Friend");
    }
  }

  const items = (outfitItems ?? [])
    .map((oi) => {
      const w = itemsById.get(oi.item_id);
      if (!w) return null;
      const isOwn = w.user_id === user.id;
      const isBorrowing = w.lent_to_user_id === user.id;
      const fromName = !isOwn ? ownerNames.get(w.user_id) ?? "Friend" : null;
      return {
        id: w.id,
        name: w.name as string,
        photo_url: w.photo_url as string | null,
        category: w.category as string,
        brand: w.brand as string | null,
        role: oi.role as string,
        isOwn,
        isBorrowing,
        fromName,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const isFallback = items.length === 0;
  const alreadyWorn = !!outfit.worn_date;
  const hasUnborrowedFriendItems = items.some(
    (i) => !i.isOwn && !i.isBorrowing
  );

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
          Today&apos;s outfit
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
              {items.map((item) => {
                const showBorrowOutline = !item.isOwn;
                return (
                  <Link
                    key={item.id}
                    href={`/wardrobe/${item.id}`}
                    className={`group block overflow-hidden rounded-2xl border-2 bg-linen-50 transition-colors ${
                      showBorrowOutline
                        ? "border-forest-500 ring-2 ring-forest-500/15"
                        : "border-linen-200"
                    }`}
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
                      {showBorrowOutline && (
                        <span className="absolute right-2 top-2 rounded-full bg-clay-500/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-linen-100">
                          Ask {item.fromName}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-charcoal">
                        {item.name}
                      </p>
                      {showBorrowOutline ? (
                        <p className="mt-0.5 truncate text-xs text-forest-700">
                          From {item.fromName}
                        </p>
                      ) : item.brand ? (
                        <p className="mt-0.5 truncate text-xs text-charcoal-muted">
                          {item.brand}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* AI reasoning — voice block */}
            {outfit.ai_reasoning && (
              <div className="mt-8 rounded-2xl border border-forest-100 bg-forest-50 px-6 py-5">
                <p className="font-heading text-lg leading-relaxed text-charcoal sm:text-xl">
                  {outfit.ai_reasoning}
                </p>
              </div>
            )}

            {/* Borrow nudge */}
            {hasUnborrowedFriendItems && (
              <div className="mt-4 rounded-2xl border border-clay-100 bg-clay-100/40 p-4 text-sm text-charcoal">
                Tap any friend&apos;s piece above to ask to borrow it. We&apos;ll
                only count it as worn once you&apos;ve actually got it.
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
