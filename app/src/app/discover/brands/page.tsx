import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Eco Brands — ReWear" };

type Brand = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  image_url: string | null;
  website_url: string | null;
  category: string | null;
};

// Category → accent colour for the hero strip on each card
const CATEGORY_ACCENT: Record<string, string> = {
  outdoor: "bg-forest-500",
  minimal: "bg-charcoal",
  feminine: "bg-clay-500",
  basics: "bg-sage-500",
  modern: "bg-forest-700",
  luxury: "bg-charcoal",
  everyday: "bg-sage-600",
  shoes: "bg-clay-600",
  denim: "bg-forest-700",
};

function accent(category: string | null): string {
  return (category && CATEGORY_ACCENT[category]) || "bg-forest-500";
}

export default async function BrandsPage() {
  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("eco_brands")
    .select("id, name, description, tags, image_url, website_url, category")
    .eq("submission_status", "verified")
    .order("name");

  const list = (brands ?? []) as Brand[];

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/discover"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Discover
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Eco Brands
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Brands worth buying from.
        </h1>
        <p className="mt-3 text-base text-charcoal-soft sm:text-lg">
          Curated list of brands taking sustainability seriously. We add new
          ones as they earn it.
        </p>

        {list.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 p-10 text-center">
            <p className="text-base text-charcoal-soft">
              The directory is being curated. Back soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {list.map((b) => (
              <Link
                key={b.id}
                href={`/discover/brands/${b.id}`}
                className="group overflow-hidden rounded-3xl border border-linen-200 bg-linen-50 transition-all hover:border-forest-500 hover:shadow-sm"
              >
                {/* Coloured top strip */}
                <div className={`h-2 w-full ${accent(b.category)}`} />

                <div className="p-7">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-heading text-2xl font-medium tracking-tight text-charcoal">
                      {b.name}
                    </h2>
                    {b.category && (
                      <span className="shrink-0 text-xs uppercase tracking-wider text-charcoal-muted">
                        {b.category}
                      </span>
                    )}
                  </div>

                  {b.description && (
                    <p className="mt-4 text-sm leading-relaxed text-charcoal-soft">
                      {b.description}
                    </p>
                  )}

                  {b.tags && b.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {b.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-linen-200 px-2.5 py-0.5 text-xs text-charcoal-soft"
                        >
                          {t.replaceAll("-", " ")}
                        </span>
                      ))}
                      {b.tags.length > 3 && (
                        <span className="rounded-full px-2.5 py-0.5 text-xs text-charcoal-muted">
                          +{b.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 px-6 py-5 text-sm text-charcoal-soft">
          <p>
            Know a brand we should add? Tell us — we vet every submission
            against the same standards.
          </p>
        </div>
      </div>
    </main>
  );
}
