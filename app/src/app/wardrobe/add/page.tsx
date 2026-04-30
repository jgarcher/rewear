import Link from "next/link";
import { addItem } from "../actions";
import { CATEGORY_LABELS, COLOUR_OPTIONS } from "@/lib/types";

export const metadata = { title: "Add to wardrobe — ReWear" };

export default function AddItemPage() {
  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/wardrobe"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Wardrobe
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Add to wardrobe
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Snap it in.
        </h1>
        <p className="mt-3 text-base text-charcoal-soft">
          Photo and the basics for now. You can fill in the rest later — or it
          will tag itself once we wire the AI in (Session 10).
        </p>

        <form action={addItem} className="mt-10 space-y-6">
          {/* Photo */}
          <div>
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-charcoal"
            >
              Photo <span className="text-error">*</span>
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              required
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-sm text-charcoal file:mr-4 file:rounded-full file:border-0 file:bg-forest-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-linen-100 hover:file:bg-forest-600"
            />
            <p className="mt-1 text-xs text-charcoal-muted">
              Bright, neutral background works best. JPG or PNG, up to 10 MB.
            </p>
          </div>

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
              placeholder="Forest-green knit jumper"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
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
                defaultValue=""
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                <option value="" disabled>
                  Pick one
                </option>
                {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(
                  (k) => (
                    <option key={k} value={k}>
                      {CATEGORY_LABELS[k]}
                    </option>
                  )
                )}
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
                defaultValue=""
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                <option value="" disabled>
                  Pick one
                </option>
                {COLOUR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand */}
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
              placeholder="Cos"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          {/* Subcategory */}
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
              placeholder="knit jumper"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

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
              placeholder="The colour everyone compliments"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-forest-500 px-6 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600"
          >
            Add to wardrobe
          </button>
        </form>
      </div>
    </main>
  );
}
