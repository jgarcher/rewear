import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OutfitPicker } from "@/components/OutfitPicker";
import { getWeather } from "@/lib/weather";

export const metadata = { title: "Outfit — ReWear" };

export default async function OutfitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { count: itemCount } = await supabase
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if ((itemCount ?? 0) < 3) {
    return (
      <main className="flex-1 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
            Outfit
          </p>
          <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            Add a few pieces first.
          </h1>
          <div className="mt-10 rounded-3xl border border-linen-200 bg-linen-50 p-10 text-center">
            <p className="text-base leading-relaxed text-charcoal-soft sm:text-lg">
              We need at least 3 items in your wardrobe before we can build
              outfits. Add a few of your favourites to get started.
            </p>
            <Link
              href="/wardrobe/add"
              className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Add a piece
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const weather = await getWeather();

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Outfit
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Pick the day, we&apos;ll pick the look.
        </h1>

        {/* Quiet weather strip */}
        <p className="mt-3 text-sm text-charcoal-muted">
          {weather.city} · {Math.round(weather.temp_c)}°C ·{" "}
          {weather.description.toLowerCase()}
        </p>

        <div className="mt-8">
          <OutfitPicker />
        </div>
      </div>
    </main>
  );
}
