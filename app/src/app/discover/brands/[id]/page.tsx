import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("eco_brands")
    .select("name")
    .eq("id", id)
    .single();
  return {
    title: data?.name ? `${data.name} — ReWear` : "Brand — ReWear",
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: brand, error } = await supabase
    .from("eco_brands")
    .select("id, name, description, tags, image_url, website_url, category")
    .eq("id", id)
    .eq("submission_status", "verified")
    .single();

  if (error || !brand) notFound();

  return (
    <main className="flex-1">
      {/* Coloured hero strip */}
      <div className={`h-3 w-full ${accent(brand.category)}`} />

      <div className="px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/discover/brands"
            className="text-sm text-charcoal-soft hover:text-forest-700"
          >
            ← All brands
          </Link>

          <div className="mt-6">
            {brand.category && (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-charcoal-muted">
                {brand.category}
              </p>
            )}
            <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              {brand.name}
            </h1>
          </div>

          {brand.description && (
            <p className="mt-8 text-lg leading-relaxed text-charcoal-soft sm:text-xl">
              {brand.description}
            </p>
          )}

          {brand.tags && brand.tags.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                What they're known for
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brand.tags.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-full bg-forest-50 px-3 py-1 text-sm text-forest-700"
                  >
                    {t.replaceAll("-", " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {brand.website_url && (
            <div className="mt-12">
              <a
                href={brand.website_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-block rounded-full bg-forest-500 px-8 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Visit {brand.name} →
              </a>
              <p className="mt-3 text-xs text-charcoal-muted">
                External link. Opens in a new tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
