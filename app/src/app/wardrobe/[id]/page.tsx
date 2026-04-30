import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarkAsWornButton } from "@/components/MarkAsWornButton";
import { DeleteItemButton } from "@/components/DeleteItemButton";
import { CATEGORY_LABELS } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("wardrobe_items")
    .select("name")
    .eq("id", id)
    .single();
  return { title: data?.name ? `${data.name} — ReWear` : "Item — ReWear" };
}

function formatRelativeDate(date: string | null): string {
  if (!date) return "never";
  const days = Math.round(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) notFound();

  // Wear stats
  const { data: wears } = await supabase
    .from("wear_log")
    .select("worn_date")
    .eq("item_id", id)
    .order("worn_date", { ascending: false });

  const wearCount = wears?.length ?? 0;
  const lastWornDate = wears && wears.length > 0 ? wears[0].worn_date : null;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/wardrobe"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Wardrobe
        </Link>

        {/* Photo */}
        <div className="relative mt-6 aspect-square w-full overflow-hidden rounded-3xl bg-linen-200">
          {item.photo_url ? (
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-charcoal-placeholder">
              No photo
            </div>
          )}
        </div>

        {/* Title block */}
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-forest-500">
            {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
            {item.subcategory ? ` · ${item.subcategory}` : ""}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
            {item.name}
          </h1>
          {item.brand && (
            <p className="mt-2 text-base text-charcoal-soft">{item.brand}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Worn", value: wearCount.toString() },
            { label: "Last worn", value: formatRelativeDate(lastWornDate) },
            { label: "Colour", value: item.primary_colour },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center"
            >
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                {s.label}
              </p>
              <p className="mt-1 truncate font-heading text-base font-medium text-charcoal">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MarkAsWornButton itemId={item.id} />
          <Link
            href={`/wardrobe/${item.id}/edit`}
            className="rounded-full border border-charcoal/15 px-6 py-3 text-center text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
          >
            Edit details
          </Link>
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Notes
            </p>
            <p className="mt-2 text-base leading-relaxed text-charcoal-soft">
              {item.notes}
            </p>
          </div>
        )}

        {/* Metadata grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-linen-200 bg-linen-50 p-6 text-sm">
          {item.material && (
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Material
              </p>
              <p className="mt-1 text-charcoal">{item.material}</p>
            </div>
          )}
          {item.acquired_source && (
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Source
              </p>
              <p className="mt-1 text-charcoal">{item.acquired_source}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Condition
            </p>
            <p className="mt-1 text-charcoal">{item.condition}</p>
          </div>
          {item.estimated_price !== null && (
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Estimated value
              </p>
              <p className="mt-1 text-charcoal">£{item.estimated_price}</p>
            </div>
          )}
        </div>

        {/* Delete */}
        <div className="mt-12 text-center">
          <DeleteItemButton itemId={item.id} itemName={item.name} />
        </div>
      </div>
    </main>
  );
}
