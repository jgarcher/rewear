"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { logTodaysOutfit, type LogOutfitResult } from "@/app/wardrobe/actions";
import { CATEGORY_LABELS } from "@/lib/types";
import type { ItemCategory, WardrobeItem } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  items: WardrobeItem[];
  wornTodayIds: string[];
  wornYesterdayIds: string[];
  currentStreak: number;
  recentUseByItemId?: Record<string, number>;
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

const MILESTONE_COPY: Record<number, string> = {
  3: "Three days. The habit is forming.",
  7: "A full week. You're rolling.",
  14: "Two weeks. Style on autopilot.",
  30: "Thirty days. This is who you are now.",
  100: "One hundred days. Legend.",
};

export function LogOutfitSheet({
  open,
  onClose,
  items,
  wornTodayIds,
  wornYesterdayIds,
  currentStreak,
  recentUseByItemId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(wornTodayIds)
  );
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<LogOutfitResult | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Yesterday section: items worn yesterday that aren't already worn today
  const yesterdayFresh = useMemo(() => {
    const todaySet = new Set(wornTodayIds);
    const yIds = new Set(wornYesterdayIds);
    return items.filter((i) => yIds.has(i.id) && !todaySet.has(i.id));
  }, [items, wornTodayIds, wornYesterdayIds]);

  // Group remaining items by category (excluding yesterdayFresh and worn-today)
  const groups = useMemo(() => {
    const featured = new Set([
      ...yesterdayFresh.map((i) => i.id),
      ...wornTodayIds,
    ]);
    const rest = items.filter((i) => !featured.has(i.id));
    const map = new Map<ItemCategory, WardrobeItem[]>();
    for (const it of rest) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => (map.get(c)?.length ?? 0) > 0).map(
      (c) => ({ category: c, items: map.get(c)! })
    );
  }, [items, yesterdayFresh, wornTodayIds]);

  const wornTodaySet = useMemo(() => new Set(wornTodayIds), [wornTodayIds]);

  function toggle(id: string) {
    if (wornTodaySet.has(id)) return; // can't unselect history
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setError("Pick at least one item.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await logTodaysOutfit(ids);
        setCelebration(result);
        // Auto-close after celebration
        setTimeout(() => {
          onClose();
        }, 2200);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Couldn't save — try again.";
        setError(msg);
      }
    });
  }

  if (!open) return null;

  // The number we show in celebration: incoming streak if no increment, else result.newStreak
  const cel = celebration;
  const newCount = selected.size;
  const newCountLabel = `${newCount} ${newCount === 1 ? "piece" : "pieces"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-charcoal/40 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative flex w-full flex-col bg-linen-50 sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-linen-200 bg-linen-50/95 px-6 pb-4 pt-6 backdrop-blur-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Today
            </p>
            <h2 className="mt-2 font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              What did you wear?
            </h2>
            <p className="mt-1 text-sm text-charcoal-soft">
              Tap everything you&apos;ve got on. We&apos;ll log it all and
              roll your streak.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-full p-2 text-charcoal-muted transition-colors hover:bg-linen-200 hover:text-charcoal"
          >
            <span aria-hidden className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-linen-200 bg-linen-100 p-8 text-center">
              <p className="font-heading text-xl font-medium text-charcoal">
                Your closet&apos;s empty.
              </p>
              <p className="mt-2 text-sm text-charcoal-soft">
                Add a few pieces and you can start logging your outfits.
              </p>
              <Link
                href="/wardrobe/add"
                onClick={onClose}
                className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Add a piece
              </Link>
            </div>
          ) : (
            <>
              {/* Already logged today (locked) */}
              {wornTodayIds.length > 0 && (
                <Section
                  label="Already logged today"
                  hint="Locked in. Add more below if you swapped pieces."
                >
                  <Grid>
                    {items
                      .filter((i) => wornTodaySet.has(i.id))
                      .map((it) => (
                        <ItemTile
                          key={it.id}
                          item={it}
                          selected
                          locked
                          onToggle={toggle}
                        />
                      ))}
                  </Grid>
                </Section>
              )}

              {/* Wear again from yesterday */}
              {yesterdayFresh.length > 0 && (
                <Section
                  label="Wear again from yesterday?"
                  hint="Quick re-pick if you're in a similar mood."
                >
                  <Grid>
                    {yesterdayFresh.map((it) => (
                      <ItemTile
                        key={it.id}
                        item={it}
                        selected={selected.has(it.id)}
                        recentUse={recentUseByItemId?.[it.id] ?? 0}
                        onToggle={toggle}
                      />
                    ))}
                  </Grid>
                </Section>
              )}

              {/* By category */}
              {groups.map((g) => (
                <Section key={g.category} label={CATEGORY_LABELS[g.category]}>
                  <Grid>
                    {g.items.map((it) => (
                      <ItemTile
                        key={it.id}
                        item={it}
                        selected={selected.has(it.id)}
                        recentUse={recentUseByItemId?.[it.id] ?? 0}
                        onToggle={toggle}
                      />
                    ))}
                  </Grid>
                </Section>
              ))}
            </>
          )}
        </div>

        {/* Sticky footer */}
        {items.length > 0 && (
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-linen-200 bg-linen-50/95 px-6 py-4 backdrop-blur-sm">
            <div className="min-w-0">
              <p className="font-heading text-base font-medium text-charcoal">
                {newCountLabel}
              </p>
              {error ? (
                <p className="text-xs text-error">{error}</p>
              ) : (
                <p className="text-xs text-charcoal-muted">
                  {currentStreak > 0
                    ? `${currentStreak}-day streak ${
                        wornTodayIds.length > 0 ? "secured" : "on the line"
                      }`
                    : "Start your streak"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || selected.size === 0}
              className="rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Log outfit"}
            </button>
          </div>
        )}

        {/* Celebration overlay */}
        {cel && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-linen-50/95 backdrop-blur-sm rw-fade-in">
            <div className="px-8 text-center">
              <div className="rw-pop">
                <p className="text-6xl">🔥</p>
                <p className="mt-4 font-heading text-5xl font-medium text-forest-500 sm:text-6xl">
                  {cel.newStreak}
                </p>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-charcoal-muted">
                  {cel.newStreak === 1 ? "day streak" : "day streak"}
                </p>
              </div>
              <p className="mt-6 font-heading text-xl text-charcoal">
                {cel.milestone
                  ? MILESTONE_COPY[cel.milestone]
                  : cel.didIncrement
                  ? "Streak rolling. Nice."
                  : cel.addedCount > 0
                  ? "Logged. See you tomorrow."
                  : "Already logged today — see you tomorrow."}
              </p>
              {cel.addedCount > 0 && (
                <p className="mt-2 text-sm text-charcoal-soft">
                  +{cel.addedCount} {cel.addedCount === 1 ? "piece" : "pieces"}
                  {cel.alreadyLoggedCount > 0
                    ? ` (${cel.alreadyLoggedCount} already in)`
                    : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          {label}
        </h3>
        {hint && <p className="text-xs text-charcoal-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{children}</div>
  );
}

function ItemTile({
  item,
  selected,
  locked = false,
  recentUse = 0,
  onToggle,
}: {
  item: WardrobeItem;
  selected: boolean;
  locked?: boolean;
  recentUse?: number;
  onToggle: (id: string) => void;
}) {
  // Soft-warn when this item has shown up 2+ times in the last 7 days /
  // upcoming schedule. Stronger visual when 3+.
  const showUse = recentUse >= 2;
  const heavy = recentUse >= 3;
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      aria-pressed={selected}
      aria-label={`${selected ? "Selected" : "Select"} ${item.name}`}
      className={`group relative block overflow-hidden rounded-2xl border-2 text-left transition-all ${
        selected
          ? "border-forest-500 ring-2 ring-forest-500/20"
          : "border-linen-200 hover:border-forest-500/60"
      } ${locked ? "cursor-default" : "cursor-pointer"}`}
    >
      <div className="relative aspect-square w-full bg-linen-200">
        {item.photo_url ? (
          <Image
            src={item.photo_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 33vw, 20vw"
            className={`object-cover transition-opacity ${
              selected ? "opacity-100" : "opacity-90 group-hover:opacity-100"
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-charcoal-placeholder">
            <span className="font-heading text-xs">No photo</span>
          </div>
        )}
        {/* Check overlay */}
        {selected && (
          <span
            aria-hidden
            className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-linen-100 shadow-md ${
              locked ? "bg-charcoal/70" : "bg-forest-500"
            }`}
          >
            ✓
          </span>
        )}
        {showUse && !selected && (
          <span
            aria-hidden
            title={`Worn or scheduled ${recentUse} times this week`}
            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              heavy
                ? "bg-clay-500 text-linen-100"
                : "bg-clay-100 text-clay-600"
            }`}
          >
            {recentUse}× this week
          </span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium text-charcoal">
          {item.name}
        </p>
      </div>
    </button>
  );
}
