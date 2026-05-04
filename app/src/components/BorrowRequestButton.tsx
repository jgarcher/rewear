"use client";

import { useState, useTransition } from "react";
import { requestBorrow } from "@/app/friends/actions";

type Props = {
  itemId: string;
  ownerName: string;
};

export function BorrowRequestButton({ itemId, ownerName }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requestedFor, setRequestedFor] = useState("");
  const [returnBy, setReturnBy] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await requestBorrow(itemId, {
          message: message.trim() || undefined,
          requestedForDate: requestedFor || undefined,
          returnBy: returnBy || undefined,
        });
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't send");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-forest-100 bg-forest-50 p-4 text-sm text-forest-700">
        Sent ✓ {ownerName} will see it next time they open the app.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
      >
        Ask to borrow
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-linen-200 bg-linen-50 p-5">
      <p className="font-heading text-lg font-medium text-charcoal">
        Ask {ownerName}
      </p>
      <p className="mt-1 text-xs text-charcoal-muted">
        A short note helps. Dates are optional.
      </p>

      <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-charcoal-muted">
        Message
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder={`Hey ${ownerName}, would love to borrow this for the weekend.`}
        className="mt-1 w-full rounded-2xl border border-linen-200 bg-linen-100 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-charcoal-muted">
            For when
          </label>
          <input
            type="date"
            value={requestedFor}
            onChange={(e) => setRequestedFor(e.target.value)}
            className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal focus:border-forest-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-charcoal-muted">
            Back by
          </label>
          <input
            type="date"
            value={returnBy}
            onChange={(e) => setReturnBy(e.target.value)}
            className="mt-1 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal focus:border-forest-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-xs font-medium text-charcoal-soft hover:text-charcoal"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send request"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </div>
  );
}
