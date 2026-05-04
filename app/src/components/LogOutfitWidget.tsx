"use client";

import Image from "next/image";
import { useState } from "react";
import { LogOutfitSheet } from "@/components/LogOutfitSheet";
import type { WardrobeItem } from "@/lib/types";

type Props = {
  streak: number;
  streakActive: boolean;     // last logged today or yesterday
  loggedToday: boolean;       // last_logged_date === today
  wardrobe: WardrobeItem[];   // active items
  wornTodayItems: WardrobeItem[];
  wornYesterdayItems: WardrobeItem[];
  recentUseByItemId?: Record<string, number>;
};

export function LogOutfitWidget({
  streak,
  streakActive,
  loggedToday,
  wardrobe,
  wornTodayItems,
  wornYesterdayItems,
  recentUseByItemId,
}: Props) {
  const [open, setOpen] = useState(false);

  const wornTodayIds = wornTodayItems.map((i) => i.id);
  const wornYesterdayIds = wornYesterdayItems.map((i) => i.id);

  // Status copy
  const showStreakNumber = streak > 0;
  const headline = loggedToday
    ? "You're sorted for today."
    : "What did you wear today?";
  const subline = loggedToday
    ? "Add anything else you wore — or come back tomorrow."
    : streak > 0 && streakActive
    ? "Lock it in to keep your streak alive."
    : streak > 0
    ? "Pick up where you left off."
    : "Log it once and you're on a streak.";

  const ctaLabel = loggedToday ? "Log more pieces" : "Log today's outfit";

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-forest-100 bg-gradient-to-br from-forest-500 to-forest-700 p-6 text-linen-100 shadow-sm sm:p-8">
        {/* Streak header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-linen-100/70">
              Today
            </p>
            <h2 className="mt-2 font-heading text-2xl font-medium sm:text-3xl">
              {headline}
            </h2>
            <p className="mt-2 text-sm text-linen-100/85 sm:text-base">
              {subline}
            </p>
          </div>
          {showStreakNumber && (
            <div
              className={`flex shrink-0 items-center gap-2 rounded-2xl bg-linen-100/10 px-3 py-2 ring-1 ring-linen-100/20 ${
                streakActive ? "" : "opacity-70"
              }`}
            >
              <span className="rw-flame text-2xl" aria-hidden>
                🔥
              </span>
              <div className="text-right">
                <p className="font-heading text-2xl font-medium leading-none">
                  {streak}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-linen-100/70">
                  {streak === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Today's logged items preview */}
        {loggedToday && wornTodayItems.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {wornTodayItems.slice(0, 5).map((it) => (
                <div
                  key={it.id}
                  className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-forest-500 bg-linen-200"
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
              {wornTodayItems.length > 5 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-forest-500 bg-linen-100/20 text-xs font-medium">
                  +{wornTodayItems.length - 5}
                </div>
              )}
            </div>
            <p className="text-sm text-linen-100/85">
              Logged ✓ ·{" "}
              {wornTodayItems.length === 1
                ? "1 piece"
                : `${wornTodayItems.length} pieces`}
            </p>
          </div>
        )}

        {/* Yesterday context */}
        {!loggedToday && wornYesterdayItems.length > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-linen-100/10 px-4 py-3 ring-1 ring-linen-100/15">
            <div className="flex -space-x-1.5">
              {wornYesterdayItems.slice(0, 4).map((it) => (
                <div
                  key={it.id}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-forest-700 bg-linen-200"
                >
                  {it.photo_url && (
                    <Image
                      src={it.photo_url}
                      alt={it.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-linen-100/80 sm:text-sm">
              Yesterday:{" "}
              {wornYesterdayItems
                .slice(0, 3)
                .map((i) => i.name)
                .join(", ")}
              {wornYesterdayItems.length > 3
                ? ` +${wornYesterdayItems.length - 3} more`
                : ""}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-linen-100 px-6 py-3 text-sm font-medium text-forest-700 transition-colors hover:bg-linen-50"
          >
            + {ctaLabel}
          </button>
          {wardrobe.length === 0 && (
            <p className="text-xs text-linen-100/70">
              Add a few pieces first.
            </p>
          )}
        </div>
      </section>

      {open && (
        <LogOutfitSheet
          open={open}
          onClose={() => setOpen(false)}
          items={wardrobe}
          wornTodayIds={wornTodayIds}
          wornYesterdayIds={wornYesterdayIds}
          currentStreak={streak}
          recentUseByItemId={recentUseByItemId}
        />
      )}
    </>
  );
}
