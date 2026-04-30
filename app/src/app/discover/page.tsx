import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Discover — ReWear" };

export default async function DiscoverPage() {
  const supabase = await createClient();

  // Counts to make the tiles feel populated
  const [
    { count: brandsCount },
    { count: tutorialsCount },
    { count: donationCount },
  ] = await Promise.all([
    supabase
      .from("eco_brands")
      .select("id", { count: "exact", head: true })
      .eq("submission_status", "verified"),
    supabase.from("upcycle_tutorials").select("id", { count: "exact", head: true }),
    supabase.from("donation_locations").select("id", { count: "exact", head: true }),
  ]);

  const TILES = [
    {
      href: "/discover/brands",
      title: "Eco Brands",
      blurb: "Brands worth buying from when you do want something new.",
      count: brandsCount ?? 0,
      countLabel: "brands",
      accent: "forest",
    },
    {
      href: "/discover/upcycle",
      title: "Upcycle",
      blurb: "Make something new from what you already own.",
      count: tutorialsCount ?? 0,
      countLabel: "tutorials",
      accent: "clay",
    },
    {
      href: "/discover/donate",
      title: "Donate",
      blurb: "Find a home for what you can't keep.",
      count: donationCount ?? 0,
      countLabel: "drop-off points",
      accent: "sage",
    },
  ];

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Discover
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Brands. Tutorials. Donation points.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-charcoal-soft sm:text-lg">
          The whole loop, beyond your wardrobe.
        </p>

        <div className="mt-10 space-y-4 sm:space-y-5">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`group block rounded-3xl border border-linen-200 bg-linen-50 p-8 transition-colors hover:border-${t.accent}-500`}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p
                    className={`text-xs font-medium uppercase tracking-[0.2em] text-${t.accent}-600`}
                  >
                    {t.count} {t.countLabel}
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-medium text-charcoal sm:text-3xl">
                    {t.title}
                  </h2>
                  <p className="mt-2 text-base text-charcoal-soft sm:text-lg">
                    {t.blurb}
                  </p>
                </div>
                <span className="font-heading text-2xl text-charcoal-muted transition-colors group-hover:text-forest-500">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
