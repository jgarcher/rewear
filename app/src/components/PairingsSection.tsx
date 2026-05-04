"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createPair, deleteSet } from "@/app/wardrobe/pairings";
import { CATEGORY_LABELS } from "@/lib/types";
import type { ItemCategory, WardrobeItem } from "@/lib/types";

type Partner = {
  setId: string;
  setName: string | null;
  item: WardrobeItem;
};

type Props = {
  itemId: string;
  itemName: string;
  partners: Partner[];
  candidates: WardrobeItem[]; // other wardrobe items (own, active, excluding self)
};

const CATEGORY_ORDER: ItemCategory[] = [
  "top",
  "tshirt",
  "bottom",
  "dress",
  "coat",
  "shoes",
  "accessory",
];

export function PairingsSection({
  itemId,
  itemName,
  partners,
  candidates,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<ItemCategory, WardrobeItem[]>();
    for (const it of candidates) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => (map.get(c)?.length ?? 0) > 0).map(
      (c) => ({ category: c, items: map.get(c)! })
    );
  }, [candidates]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setSelected(new Set());
    setName("");
    setError(null);
  }

  function handleSave() {
    setError(null);
    const partnerIds = Array.from(selected);
    if (partnerIds.length === 0) {
      setError("Pick at least one piece to pair with.");
      return;
    }
    startTransition(async () => {
      try {
        await createPair(itemId, partnerIds, name || null);
        setOpen(false);
        reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  }

  function handleRemove(setId: string) {
    if (!confirm("Remove this pairing?")) return;
    startTransition(async () => {
      try {
        await deleteSet(setId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't remove");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-linen-200 bg-linen-50 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Goes well with
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-forest-700 hover:underline"
        >
          + Pair with another piece
        </button>
      </div>

      {partners.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal-soft">
          You haven&apos;t paired this with anything yet. Tap{" "}
          <em>Pair with another piece</em> to mark items that work together —
          we&apos;ll keep them in mind when building outfits.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {partners.map((p) => (
            <div key={`${p.setId}-${p.item.id}`} className="group relative">
              <Link
                href={`/wardrobe/${p.item.id}`}
                className="block overflow-hidden rounded-2xl border border-linen-200 bg-linen-100 transition-colors hover:border-forest-500"
              >
                <div className="relative aspect-square w-full bg-linen-200">
                  {p.item.photo_url ? (
                    <Image
                      src={p.item.photo_url}
                      alt={p.item.name}
                      fill
                      sizes="(max-width: 640px) 33vw, 20vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-charcoal">
                    {p.item.name}
                  </p>
                  {p.setName && (
                    <p className="truncate text-[10px] text-charcoal-muted">
                      {p.setName}
                    </p>
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(p.setId)}
                disabled={pending}
                aria-label="Remove pairing"
                className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-charcoal/80 text-xs font-bold text-linen-100 transition-opacity hover:bg-error group-hover:flex"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && !open && (
        <p className="mt-3 text-xs text-error">{error}</p>
      )}

      {/* Picker modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-charcoal/40 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="relative flex w-full flex-col bg-linen-50 sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-linen-200 bg-linen-50/95 px-6 pb-4 pt-6 backdrop-blur-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                  Pair with
                </p>
                <h2 className="mt-2 font-heading text-2xl font-medium text-charcoal sm:text-3xl">
                  What goes with {itemName}?
                </h2>
                <p className="mt-1 text-sm text-charcoal-soft">
                  Tap any pieces that work as a set with this one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                aria-label="Close"
                className="-mr-2 -mt-1 rounded-full p-2 text-charcoal-muted hover:bg-linen-200 hover:text-charcoal"
              >
                <span aria-hidden className="text-2xl leading-none">
                  ×
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
              {/* Optional name */}
              <div className="rounded-2xl border border-linen-200 bg-linen-100 p-4">
                <label className="text-xs font-medium uppercase tracking-wider text-charcoal-muted">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Sunday brunch · Job interview · My signature"
                  className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-50 px-3 py-2 text-sm text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none"
                />
              </div>

              {candidates.length === 0 ? (
                <p className="mt-6 text-sm text-charcoal-soft">
                  Add a few more pieces to your wardrobe and you can start
                  pairing.
                </p>
              ) : (
                groups.map((g) => (
                  <section key={g.category} className="mt-5 first:mt-0 sm:mt-6">
                    <h3 className="mb-2 mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                      {CATEGORY_LABELS[g.category]}
                    </h3>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {g.items.map((it) => {
                        const checked = selected.has(it.id);
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => toggle(it.id)}
                            aria-pressed={checked}
                            className={`group relative block overflow-hidden rounded-2xl border-2 text-left transition-all ${
                              checked
                                ? "border-forest-500 ring-2 ring-forest-500/20"
                                : "border-linen-200 hover:border-forest-500/60"
                            }`}
                          >
                            <div className="relative aspect-square w-full bg-linen-200">
                              {it.photo_url ? (
                                <Image
                                  src={it.photo_url}
                                  alt={it.name}
                                  fill
                                  sizes="(max-width: 640px) 33vw, 20vw"
                                  className="object-cover"
                                />
                              ) : null}
                              {checked && (
                                <span
                                  aria-hidden
                                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-forest-500 text-xs font-bold text-linen-100 shadow-md"
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="px-2 py-1.5">
                              <p className="truncate text-xs font-medium text-charcoal">
                                {it.name}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-linen-200 bg-linen-50/95 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs text-charcoal-muted">
                {selected.size}{" "}
                {selected.size === 1 ? "piece selected" : "pieces selected"}
                {error ? ` · ${error}` : ""}
              </p>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || selected.size === 0}
                className="rounded-full bg-forest-500 px-6 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save pairing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
