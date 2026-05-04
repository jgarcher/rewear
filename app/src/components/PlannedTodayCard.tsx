"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { wearScheduledOutfit } from "@/app/schedule/actions";
import type { WardrobeItem } from "@/lib/types";

type Props = {
  outfitId: string;
  outfitName: string | null;
  scheduledDate: string;
  items: WardrobeItem[];
};

export function PlannedTodayCard({
  outfitId,
  outfitName,
  scheduledDate,
  items,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleWear() {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const r = await wearScheduledOutfit(outfitId);
        setFeedback(
          r.didIncrement
            ? `🔥 ${r.newStreak}-day streak!`
            : `Logged ${r.wornCount} ${r.wornCount === 1 ? "piece" : "pieces"} ✓`
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't log");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-clay-100 bg-clay-100/30 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-clay-600">
          Planned today
        </p>
        <Link
          href={`/schedule/${scheduledDate}`}
          className="text-xs text-charcoal-muted hover:text-forest-700"
        >
          Edit →
        </Link>
      </div>
      {outfitName && (
        <p className="mt-2 font-heading text-lg font-medium text-charcoal sm:text-xl">
          {outfitName}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex -space-x-2">
          {items.slice(0, 5).map((it) => (
            <div
              key={it.id}
              className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-clay-100 bg-linen-200"
            >
              {it.photo_url && (
                <Image
                  src={it.photo_url}
                  alt={it.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
          {items.length > 5 && (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-clay-100 bg-clay-500/10 text-xs font-medium text-clay-600">
              +{items.length - 5}
            </span>
          )}
        </div>
        <p className="text-sm text-charcoal-soft">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleWear}
          disabled={pending}
          className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {pending ? "Logging…" : "Wear this today"}
        </button>
        {feedback && (
          <span className="text-sm font-medium text-forest-700">{feedback}</span>
        )}
        {error && <span className="text-sm text-error">{error}</span>}
      </div>
    </section>
  );
}
