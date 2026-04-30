"use client";

import { useState, useTransition } from "react";
import { generateOutfitAction } from "@/app/outfit/actions";

const OCCASIONS = [
  { value: "school", label: "School" },
  { value: "work", label: "Work" },
  { value: "going-out", label: "Going out" },
  { value: "errands", label: "Errands" },
  { value: "special", label: "Special" },
  { value: "just-home", label: "Just home" },
];

const VIBES = [
  { value: "", label: "No preference" },
  { value: "cosy", label: "Cosy" },
  { value: "sharp", label: "Sharp" },
  { value: "easy", label: "Easy" },
  { value: "dressed-up", label: "Dressed up" },
  { value: "surprise", label: "Surprise me" },
];

export function OutfitForm() {
  const [occasion, setOccasion] = useState<string>("");
  const [vibe, setVibe] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!occasion) {
      setError("Pick an occasion first.");
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await generateOutfitAction(formData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        // Next.js redirect throws a NEXT_REDIRECT — let it through
        if (message.includes("NEXT_REDIRECT")) return;
        setError(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Occasion */}
      <fieldset>
        <legend className="text-sm font-medium text-charcoal">
          Occasion <span className="text-error">*</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const isActive = occasion === o.value;
            return (
              <label
                key={o.value}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border-forest-500 bg-forest-500 text-linen-100"
                    : "border-linen-300 bg-linen-50 text-charcoal-soft hover:border-forest-500"
                }`}
              >
                <input
                  type="radio"
                  name="occasion"
                  value={o.value}
                  checked={isActive}
                  onChange={() => setOccasion(o.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Vibe */}
      <fieldset>
        <legend className="text-sm font-medium text-charcoal">
          Vibe <span className="text-charcoal-muted">(optional)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIBES.map((v) => {
            const isActive = vibe === v.value;
            return (
              <label
                key={v.value || "none"}
                className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border-forest-500 bg-forest-500 text-linen-100"
                    : "border-linen-300 bg-linen-50 text-charcoal-soft hover:border-forest-500"
                }`}
              >
                <input
                  type="radio"
                  name="vibe"
                  value={v.value}
                  checked={isActive}
                  onChange={() => setVibe(v.value)}
                  className="sr-only"
                />
                {v.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !occasion}
        className="w-full rounded-full bg-forest-500 px-6 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
      >
        {pending ? "Stitching that together…" : "Build my outfit"}
      </button>

      {pending && (
        <p className="text-center text-sm text-charcoal-muted">
          Looking through your closet…
        </p>
      )}
    </form>
  );
}
