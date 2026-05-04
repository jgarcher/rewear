"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deleteScheduledOutfit,
  saveScheduledOutfit,
  wearScheduledOutfit,
} from "@/app/schedule/actions";
import { CATEGORY_LABELS } from "@/lib/types";
import type { ItemCategory, WardrobeItem } from "@/lib/types";

type Props = {
  scheduledDate: string;
  isToday: boolean;
  initialName: string;
  initialItemIds: string[];
  outfitId: string | null;
  alreadyWorn: boolean;
  items: WardrobeItem[];
  borrowedOwnerNames: Record<string, string>; // itemId -> owner name
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

export function SchedulePlanner({
  scheduledDate,
  isToday,
  initialName,
  initialItemIds,
  outfitId,
  alreadyWorn,
  items,
  borrowedOwnerNames,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialItemIds)
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<ItemCategory, WardrobeItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => (map.get(c)?.length ?? 0) > 0).map(
      (c) => ({ category: c, items: map.get(c)! })
    );
  }, [items]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    setFeedback(null);
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setError("Pick at least one item.");
      return;
    }
    startTransition(async () => {
      try {
        await saveScheduledOutfit(scheduledDate, ids, name.trim() || null);
        setFeedback("Saved ✓");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  }

  function handleDelete() {
    if (!outfitId) return;
    if (!confirm("Delete this scheduled outfit?")) return;
    startTransition(async () => {
      try {
        await deleteScheduledOutfit(outfitId);
        router.push("/schedule");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't delete");
      }
    });
  }

  function handleWear() {
    if (!outfitId) return;
    startTransition(async () => {
      try {
        const r = await wearScheduledOutfit(outfitId);
        setFeedback(
          r.didIncrement
            ? `🔥 ${r.newStreak}-day streak!`
            : `Logged ${r.wornCount} ${r.wornCount === 1 ? "piece" : "pieces"} ✓`
        );
        setTimeout(() => router.push("/"), 1200);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't log");
      }
    });
  }

  return (
    <div>
      {/* Name input */}
      <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4">
        <label
          htmlFor="outfit_name"
          className="text-xs font-medium uppercase tracking-wider text-charcoal-muted"
        >
          Name (optional)
        </label>
        <input
          id="outfit_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Beach day · Job interview · Family lunch"
          className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none"
        />
      </div>

      {/* Item picker */}
      <div className="mt-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-linen-200 bg-linen-50 p-6 text-center">
            <p className="font-heading text-lg font-medium text-charcoal">
              Your closet&apos;s empty.
            </p>
            <p className="mt-2 text-sm text-charcoal-soft">
              Add a few pieces and you can plan ahead.
            </p>
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.category} className="mt-5 first:mt-0">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                  {CATEGORY_LABELS[g.category]}
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {g.items.map((it) => {
                    const checked = selected.has(it.id);
                    const borrowedFrom = borrowedOwnerNames[it.id] ?? null;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => toggle(it.id)}
                        aria-pressed={checked}
                        className={`group relative block overflow-hidden rounded-2xl border-2 text-left transition-all ${
                          checked
                            ? "border-forest-500 ring-2 ring-forest-500/20"
                            : borrowedFrom
                            ? "border-forest-100 hover:border-forest-500/60"
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
                          {borrowedFrom && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-clay-500/95 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-linen-100">
                              Borrowed
                            </span>
                          )}
                        </div>
                        <div className="px-2 py-1.5">
                          <p className="truncate text-xs font-medium text-charcoal">
                            {it.name}
                          </p>
                          {borrowedFrom && (
                            <p className="truncate text-[10px] text-charcoal-muted">
                              From {borrowedFrom}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-linen-200 bg-linen-100/95 py-4 backdrop-blur-sm">
        <div className="text-xs text-charcoal-muted">
          {selected.size}{" "}
          {selected.size === 1 ? "piece selected" : "pieces selected"}
          {feedback ? ` · ${feedback}` : ""}
          {error ? ` · ${error}` : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          {outfitId && !alreadyWorn && isToday && (
            <button
              type="button"
              onClick={handleWear}
              disabled={pending}
              className="rounded-full border border-forest-500 px-5 py-2.5 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-50 disabled:opacity-60"
            >
              Wear today
            </button>
          )}
          {outfitId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-full border border-charcoal/15 px-4 py-2.5 text-xs font-medium text-charcoal-soft transition-colors hover:border-error hover:text-error disabled:opacity-60"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || selected.size === 0}
            className="rounded-full bg-forest-500 px-6 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
          >
            {pending ? "Saving…" : alreadyWorn ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
