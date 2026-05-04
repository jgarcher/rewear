"use client";

import { useState, useTransition } from "react";
import { setItemShareState } from "@/app/wardrobe/actions";
import {
  SHARE_STATE_HINTS,
  SHARE_STATE_LABELS,
  type ShareState,
} from "@/lib/types";

const STATES: ShareState[] = ["private", "borrowable", "up_for_grabs"];

type Props = {
  itemId: string;
  current: ShareState;
  isLent?: boolean;
};

export function ShareStatePicker({ itemId, current, isLent = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<ShareState>(current);
  const [error, setError] = useState<string | null>(null);

  function pick(next: ShareState) {
    if (pending || next === value || isLent) return;
    setError(null);
    const prev = value;
    setValue(next); // optimistic
    startTransition(async () => {
      try {
        await setItemShareState(itemId, next);
      } catch (e) {
        setValue(prev);
        setError(e instanceof Error ? e.message : "Couldn't update");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Sharing
        </p>
        {pending && (
          <span className="text-xs text-charcoal-muted">Saving…</span>
        )}
      </div>

      {isLent && (
        <p className="mt-2 text-xs text-charcoal-soft">
          Currently lent out. Settings locked until it&apos;s back.
        </p>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {STATES.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              disabled={pending || isLent}
              onClick={() => pick(s)}
              aria-pressed={active}
              className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors disabled:opacity-60 ${
                active
                  ? "border-forest-500 bg-forest-500 text-linen-100"
                  : "border-linen-200 bg-linen-100 text-charcoal-soft hover:border-forest-500"
              }`}
            >
              <p className="font-medium">{SHARE_STATE_LABELS[s]}</p>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-charcoal-muted">
        {SHARE_STATE_HINTS[value]}
      </p>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
