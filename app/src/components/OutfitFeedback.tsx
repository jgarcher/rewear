"use client";

import { useState, useTransition } from "react";
import { rateOutfit } from "@/app/outfit/actions";
import type { OutfitRating } from "@/lib/types";

type Props = {
  outfitId: string;
  initialRating: OutfitRating | null;
  initialComment: string | null;
};

function ThumbUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Z" />
      <path d="M7 11l4-7a2.5 2.5 0 0 1 4.7 1.5L15 9h4.5a2 2 0 0 1 2 2.3l-1.1 7a2 2 0 0 1-2 1.7H7" />
    </svg>
  );
}

function ThumbDownIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3Z" />
      <path d="M17 13l-4 7a2.5 2.5 0 0 1-4.7-1.5L9 15H4.5a2 2 0 0 1-2-2.3l1.1-7A2 2 0 0 1 5.6 4H17" />
    </svg>
  );
}

export function OutfitFeedback({
  outfitId,
  initialRating,
  initialComment,
}: Props) {
  const [rating, setRating] = useState<OutfitRating | null>(initialRating);
  const [comment, setComment] = useState(initialComment ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  function submit(next: OutfitRating, nextComment: string = comment) {
    setError(null);
    const prev = rating;
    setRating(next);
    startTransition(async () => {
      try {
        await rateOutfit(outfitId, next, nextComment);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      } catch (e) {
        setRating(prev);
        setError(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  }

  function handleCommentBlur() {
    if (!rating) return;
    if (comment.trim() === (initialComment ?? "").trim()) return;
    submit(rating, comment);
  }

  return (
    <div className="rounded-2xl border border-linen-200 bg-linen-50 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
        How&apos;d we do?
      </p>
      <p className="mt-1 text-sm text-charcoal-soft">
        A quick thumb helps the AI learn what you like. Add a note if you want
        — what worked, what didn&apos;t.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => submit("up")}
          disabled={pending}
          aria-pressed={rating === "up"}
          aria-label="Like this outfit"
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
            rating === "up"
              ? "border-forest-500 bg-forest-500 text-linen-100"
              : "border-linen-200 bg-linen-100 text-charcoal-soft hover:border-forest-500 hover:text-forest-700"
          } disabled:opacity-60`}
        >
          <ThumbUpIcon filled={rating === "up"} />
        </button>
        <button
          type="button"
          onClick={() => submit("down")}
          disabled={pending}
          aria-pressed={rating === "down"}
          aria-label="Pass on this outfit"
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
            rating === "down"
              ? "border-clay-500 bg-clay-500 text-linen-100"
              : "border-linen-200 bg-linen-100 text-charcoal-soft hover:border-clay-500 hover:text-clay-600"
          } disabled:opacity-60`}
        >
          <ThumbDownIcon filled={rating === "down"} />
        </button>

        <p className="text-xs text-charcoal-muted">
          {savedFlash
            ? "Saved ✓"
            : rating === "up"
            ? "Loved it"
            : rating === "down"
            ? "Not quite"
            : "Tap to rate"}
        </p>
      </div>

      {rating && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleCommentBlur}
          rows={2}
          maxLength={280}
          placeholder={
            rating === "up"
              ? "What worked? (optional)"
              : "What was off? (optional — colours, fit, occasion…)"
          }
          className="mt-4 w-full rounded-xl border border-linen-200 bg-linen-100 px-3 py-2 text-sm text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none"
          disabled={pending}
        />
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
