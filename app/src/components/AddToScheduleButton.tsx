"use client";

import { useState, useTransition } from "react";
import { addItemToSchedule } from "@/app/schedule/actions";

type Props = { itemId: string };

export function AddToScheduleButton({ itemId }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      try {
        await addItemToSchedule(itemId, date);
        // The action redirects via Next's redirect() — control won't return
        // here on success. If we do land here, swallow.
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't add";
        // NEXT_REDIRECT is the synthetic error Next throws on redirect()
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-charcoal/15 px-6 py-3 text-center text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
      >
        Add to schedule
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-linen-200 bg-linen-50 p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <label className="text-xs font-medium uppercase tracking-wider text-charcoal-muted">
          Pick a date
        </label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal focus:border-forest-500 focus:outline-none"
        />
        {error && <p className="mt-2 text-xs text-error">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-xs font-medium text-charcoal-soft hover:text-charcoal"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handle}
          disabled={pending}
          className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}
