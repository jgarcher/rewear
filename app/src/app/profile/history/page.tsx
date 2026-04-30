import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Outfit history — ReWear" };

type OutfitRow = {
  id: string;
  occasion: string | null;
  weather: string | null;
  ai_reasoning: string | null;
  worn_date: string;
  source: string;
};

type ItemMini = {
  id: string;
  name: string;
  photo_url: string | null;
};

function formatDate(d: string): string {
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const diff = Math.round(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all worn outfits for this user, newest first
  const { data: outfitsRaw } = await supabase
    .from("outfits")
    .select("id, occasion, weather, ai_reasoning, worn_date, source")
    .eq("user_id", user.id)
    .not("worn_date", "is", null)
    .order("worn_date", { ascending: false })
    .limit(60);

  const outfits = (outfitsRaw ?? []) as OutfitRow[];

  // Pull all items in one go
  const outfitIds = outfits.map((o) => o.id);
  const { data: outfitItemsRaw } = outfitIds.length
    ? await supabase
        .from("outfit_items")
        .select("outfit_id, item_id, role")
        .in("outfit_id", outfitIds)
    : { data: [] };

  const itemIds = Array.from(
    new Set((outfitItemsRaw ?? []).map((oi) => oi.item_id))
  );
  const { data: itemsRaw } = itemIds.length
    ? await supabase
        .from("wardrobe_items")
        .select("id, name, photo_url")
        .in("id", itemIds)
    : { data: [] };

  const itemMap = new Map(
    ((itemsRaw ?? []) as ItemMini[]).map((i) => [i.id, i])
  );

  // Group items by outfit
  const itemsByOutfit = new Map<string, ItemMini[]>();
  for (const oi of outfitItemsRaw ?? []) {
    const item = itemMap.get(oi.item_id);
    if (!item) continue;
    const arr = itemsByOutfit.get(oi.outfit_id) ?? [];
    arr.push(item);
    itemsByOutfit.set(oi.outfit_id, arr);
  }

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Profile
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          History
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          {outfits.length === 0
            ? "Nothing logged yet."
            : `${outfits.length} ${outfits.length === 1 ? "outfit" : "outfits"} logged.`}
        </h1>

        {outfits.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 p-10 text-center">
            <p className="text-base text-charcoal-soft">
              Log a few outfits and they'll show up here. The longer you do it,
              the better the picture of what you actually wear.
            </p>
            <Link
              href="/outfit"
              className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Build an outfit
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {outfits.map((outfit) => {
              const items = itemsByOutfit.get(outfit.id) ?? [];
              return (
                <article
                  key={outfit.id}
                  className="rounded-2xl border border-linen-200 bg-linen-50 p-5 sm:p-6"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-heading text-lg font-medium text-charcoal">
                      {formatDate(outfit.worn_date)}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                      {outfit.occasion ?? "Day"}
                      {outfit.source === "ai_accepted" ||
                      outfit.source === "ai_generated"
                        ? " · AI"
                        : ""}
                    </p>
                  </div>

                  {outfit.weather && (
                    <p className="mt-1 text-xs text-charcoal-muted">
                      {outfit.weather}
                    </p>
                  )}

                  {/* Item thumbnails */}
                  {items.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.map((it) => (
                        <Link
                          key={it.id}
                          href={`/wardrobe/${it.id}`}
                          className="group relative h-16 w-16 overflow-hidden rounded-lg bg-linen-200"
                          title={it.name}
                        >
                          {it.photo_url ? (
                            <Image
                              src={it.photo_url}
                              alt={it.name}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-charcoal-placeholder">
                              {it.name.split(" ")[0]}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  {outfit.ai_reasoning && (
                    <p className="mt-4 text-sm leading-relaxed text-charcoal-soft">
                      {outfit.ai_reasoning}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
