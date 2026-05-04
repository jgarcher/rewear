"use client";

import { useEffect, useState, useTransition } from "react";
import { planTripAction } from "@/app/schedule/actions";

type Props = {
  from: string;
  to: string;
  numDays: number;
  numUnplanned: number;
};

const PROGRESS_COPY = [
  "Reading your wardrobe…",
  "Sketching out the days…",
  "Balancing colours and shapes…",
  "Picking your outfits…",
  "Almost there…",
];

export function TripPlannerForm({
  from,
  to,
  numDays,
  numUnplanned,
}: Props) {
  const [tripContext, setTripContext] = useState("");
  const [tripName, setTripName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);

  // Cycle through progress copy while the AI is thinking so the user knows
  // something's still happening.
  useEffect(() => {
    if (!pending) {
      setProgressIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressIndex((p) => Math.min(p + 1, PROGRESS_COPY.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [pending]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await planTripAction(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Couldn't plan";
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  if (numUnplanned === 0) {
    return (
      <p className="text-sm text-charcoal-soft">
        Every day in this range is already planned. Edit individual days
        below or shift your dates above.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />

      <div>
        <label
          htmlFor="trip_context"
          className="block text-xs font-medium uppercase tracking-wider text-charcoal-muted"
        >
          Tell us about the trip
        </label>
        <textarea
          id="trip_context"
          name="trip_context"
          value={tripContext}
          onChange={(e) => setTripContext(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Greece, mostly beach + long dinners. One nice meal out."
          className="mt-1 w-full rounded-2xl border border-linen-200 bg-linen-100 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          disabled={pending}
        />
        <p className="mt-1 text-xs text-charcoal-muted">
          Vibe, weather, occasions — whatever helps.
        </p>
      </div>

      <div>
        <label
          htmlFor="trip_name"
          className="block text-xs font-medium uppercase tracking-wider text-charcoal-muted"
        >
          Trip name (optional)
        </label>
        <input
          id="trip_name"
          type="text"
          name="trip_name"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          maxLength={60}
          placeholder="Greek week · Wedding weekend"
          className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none"
          disabled={pending}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-charcoal-muted">
          We&apos;ll plan {numUnplanned}{" "}
          {numUnplanned === 1 ? "day" : "days"}
          {numUnplanned < numDays
            ? ` (${numDays - numUnplanned} already done — won't touch those)`
            : ""}
          .
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest-500 px-6 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {pending ? "Planning…" : "Plan with AI ✨"}
        </button>
      </div>

      {pending && (
        <div className="rounded-2xl border border-forest-100 bg-forest-50 p-4">
          <p className="text-sm text-forest-700">
            <span className="rw-flame mr-2 inline-block">🔥</span>
            {PROGRESS_COPY[progressIndex]}
          </p>
          <p className="mt-1 text-xs text-charcoal-muted">
            Plans like this take 20–30 seconds. Stay on the page.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
    </form>
  );
}
