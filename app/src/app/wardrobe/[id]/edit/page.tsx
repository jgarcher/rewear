import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateItemAction } from "@/app/wardrobe/actions";
import { CATEGORY_LABELS, COLOUR_OPTIONS } from "@/lib/types";

const SEASON_OPTIONS = [
  { value: "all", label: "All-season" },
  { value: "winter", label: "Winter" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
];

const OCCASION_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "work", label: "Work" },
  { value: "evening", label: "Evening" },
  { value: "athletic", label: "Athletic" },
  { value: "special", label: "Special" },
];

export const metadata = { title: "Edit item — ReWear" };

export default async function EditItemPage({
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

  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !item) notFound();

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/wardrobe/${item.id}`}
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Back to item
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Edit
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          {item.name}
        </h1>

        {/* Photo (read-only — re-photographing means deleting) */}
        {item.photo_url && (
          <div className="mt-8 relative aspect-square w-full overflow-hidden rounded-2xl bg-linen-200">
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
            />
            <div className="absolute bottom-3 right-3 rounded-full bg-charcoal/70 px-3 py-1 text-xs text-linen-100">
              Photo can't be changed — delete and re-add to swap
            </div>
          </div>
        )}

        <form action={updateItemAction} className="mt-8 space-y-5">
          <input type="hidden" name="item_id" value={item.id} />

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-charcoal"
            >
              Name <span className="text-error">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={item.name}
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          {/* Category + Colour */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-charcoal"
              >
                Category <span className="text-error">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                defaultValue={item.category}
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                {(
                  Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>
                ).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="primary_colour"
                className="block text-sm font-medium text-charcoal"
              >
                Colour <span className="text-error">*</span>
              </label>
              <select
                id="primary_colour"
                name="primary_colour"
                required
                defaultValue={item.primary_colour}
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                {COLOUR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand + subcategory */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-charcoal"
              >
                Brand <span className="text-charcoal-muted">(optional)</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                maxLength={120}
                defaultValue={item.brand ?? ""}
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
            </div>
            <div>
              <label
                htmlFor="subcategory"
                className="block text-sm font-medium text-charcoal"
              >
                Style <span className="text-charcoal-muted">(optional)</span>
              </label>
              <input
                id="subcategory"
                name="subcategory"
                type="text"
                maxLength={80}
                defaultValue={item.subcategory ?? ""}
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
            </div>
          </div>

          {/* Material */}
          <div>
            <label
              htmlFor="material"
              className="block text-sm font-medium text-charcoal"
            >
              Material <span className="text-charcoal-muted">(optional)</span>
            </label>
            <input
              id="material"
              name="material"
              type="text"
              maxLength={80}
              defaultValue={item.material ?? ""}
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          {/* Seasons */}
          <fieldset>
            <legend className="text-sm font-medium text-charcoal">
              Seasons
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SEASON_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  name="seasons"
                  value={opt.value}
                  label={opt.label}
                  defaultChecked={(item.seasons ?? []).includes(opt.value)}
                />
              ))}
            </div>
          </fieldset>

          {/* Occasions */}
          <fieldset>
            <legend className="text-sm font-medium text-charcoal">
              Occasions
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASION_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  name="occasions"
                  value={opt.value}
                  label={opt.label}
                  defaultChecked={(item.occasions ?? []).includes(opt.value)}
                />
              ))}
            </div>
          </fieldset>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-charcoal"
            >
              Notes <span className="text-charcoal-muted">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              defaultValue={item.notes ?? ""}
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="submit"
              className="flex-1 rounded-full bg-forest-500 px-6 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Save changes
            </button>
            <Link
              href={`/wardrobe/${item.id}`}
              className="rounded-full border border-charcoal/15 px-6 py-4 text-center text-base text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function Chip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-block rounded-full border border-linen-300 bg-linen-50 px-4 py-2 text-sm text-charcoal-soft transition-colors peer-checked:border-forest-500 peer-checked:bg-forest-500 peer-checked:text-linen-100 hover:border-forest-500">
        {label}
      </span>
    </label>
  );
}
