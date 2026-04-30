import Link from "next/link";
import { AddItemFlow } from "@/components/AddItemFlow";

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
          One photo. We'll do the rest.
        </h1>
        <p className="mt-3 text-base text-charcoal-soft">
          Snap or upload a photo. We'll guess the basics — you confirm or edit.
        </p>

        <div className="mt-10">
          <AddItemFlow />
        </div>
      </div>
    </main>
  );
}
