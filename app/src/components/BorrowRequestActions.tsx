"use client";

import { useState, useTransition } from "react";
import {
  cancelBorrowRequest,
  markReceived,
  markReturned,
  respondToBorrowRequest,
} from "@/app/friends/actions";

export function IncomingRequestActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(action: "approve" | "decline") {
    setError(null);
    startTransition(async () => {
      try {
        await respondToBorrowRequest(requestId, action);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't update");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => decide("approve")}
        disabled={pending}
        className="rounded-full bg-forest-500 px-4 py-2 text-xs font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
      >
        {pending ? "…" : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => decide("decline")}
        disabled={pending}
        className="rounded-full border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal-soft transition-colors hover:border-error hover:text-error disabled:opacity-60"
      >
        Decline
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      try {
        await cancelBorrowRequest(requestId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't cancel");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="rounded-full border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal-soft transition-colors hover:border-error hover:text-error disabled:opacity-60"
      >
        {pending ? "…" : "Cancel request"}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

export function MarkReceivedButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      try {
        await markReceived(requestId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't update");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="rounded-full bg-forest-500 px-4 py-2 text-xs font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
      >
        {pending ? "…" : "I've got it ✓"}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

export function MarkReturnedButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      try {
        await markReturned(requestId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't update");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="rounded-full bg-forest-500 px-4 py-2 text-xs font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
      >
        {pending ? "…" : "Mark returned"}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
