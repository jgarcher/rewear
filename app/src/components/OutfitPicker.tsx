"use client";

import { useState, useTransition } from "react";
import {
  generateOutfitAction,
  magicOutfitAction,
} from "@/app/outfit/actions";

type IconProps = { active?: boolean };

function SchoolIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <path d="M3 6h18l-2 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 6Z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M8 11h8" />
    </svg>
  );
}

function WorkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function GoingOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <path d="M12 3l1.7 4.5L18 9l-4.3 1.5L12 15l-1.7-4.5L6 9l4.3-1.5L12 3Z" />
      <circle cx="18.5" cy="17.5" r="1" />
      <circle cx="5.5" cy="18.5" r="0.6" />
    </svg>
  );
}

function ErrandsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <path d="M5 8h14l-1.5 11a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function SpecialIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <path d="M12 2.5l2.6 5.6 6.1.5-4.6 4 1.4 6-5.5-3.2-5.5 3.2 1.4-6-4.6-4 6.1-.5L12 2.5Z" />
    </svg>
  );
}

function JustHomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M9 20v-5a3 3 0 0 1 6 0v5" />
    </svg>
  );
}

const OCCASIONS: Array<{
  value: "school" | "work" | "going-out" | "errands" | "special" | "just-home";
  label: string;
  hint: string;
  Icon: (props: IconProps) => React.ReactNode;
}> = [
  { value: "school", label: "School", hint: "Easy and on-time", Icon: SchoolIcon },
  { value: "work", label: "Work", hint: "Polished, considered", Icon: WorkIcon },
  { value: "going-out", label: "Going out", hint: "A bit of a moment", Icon: GoingOutIcon },
  { value: "errands", label: "Errands", hint: "Comfortable, low-key", Icon: ErrandsIcon },
  { value: "special", label: "Special", hint: "Something you've been saving", Icon: SpecialIcon },
  { value: "just-home", label: "Just home", hint: "Cosy, no rules", Icon: JustHomeIcon },
];

const VIBES = [
  { value: "", label: "No preference" },
  { value: "cosy", label: "Cosy" },
  { value: "sharp", label: "Sharp" },
  { value: "easy", label: "Easy" },
  { value: "dressed-up", label: "Dressed up" },
  { value: "surprise", label: "Surprise" },
];

export function OutfitPicker() {
  const [vibe, setVibe] = useState<string>("");
  const [pendingOccasion, setPendingOccasion] = useState<string | null>(null);
  const [pendingMagic, setPendingMagic] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMagic() {
    if (pendingMagic || pendingOccasion) return;
    setError(null);
    setPendingMagic(true);
    startTransition(async () => {
      try {
        await magicOutfitAction();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't generate";
        if (msg.includes("NEXT_REDIRECT")) return;
        setPendingMagic(false);
        setError(msg);
      }
    });
  }

  function handleOccasion(occasion: string) {
    if (pendingOccasion || pendingMagic) return;
    setError(null);
    setPendingOccasion(occasion);
    const fd = new FormData();
    fd.set("occasion", occasion);
    fd.set("vibe", vibe);
    startTransition(async () => {
      try {
        await generateOutfitAction(fd);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't generate";
        if (msg.includes("NEXT_REDIRECT")) return;
        setPendingOccasion(null);
        setError(msg);
      }
    });
  }

  const anyPending = pendingMagic || !!pendingOccasion;

  return (
    <div>
      {/* Hero: surprise me */}
      <button
        type="button"
        onClick={handleMagic}
        disabled={anyPending}
        className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-forest-500 to-forest-700 px-8 py-7 text-left text-linen-100 shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-90"
      >
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-linen-100/70">
          One tap
        </p>
        <p className="mt-2 font-heading text-2xl font-medium sm:text-3xl">
          {pendingMagic ? "Stitching it together…" : "Surprise me ✨"}
        </p>
        <p className="mt-1 text-sm text-linen-100/85">
          We&apos;ll pick something fresh from your closet.
        </p>
        {pendingMagic && (
          <span className="rw-flame absolute right-6 top-1/2 -translate-y-1/2 text-3xl">
            🔥
          </span>
        )}
      </button>

      {/* Or by occasion */}
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-linen-300" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-charcoal-muted">
          Or pick the occasion
        </p>
        <span className="h-px flex-1 bg-linen-300" />
      </div>

      {/* Occasion grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {OCCASIONS.map((o) => {
          const isPending = pendingOccasion === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => handleOccasion(o.value)}
              disabled={anyPending}
              className={`group flex flex-col items-start gap-2 rounded-2xl border bg-linen-50 p-4 text-left transition-all disabled:opacity-60 ${
                isPending
                  ? "border-forest-500 bg-forest-500/5"
                  : "border-linen-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-sm"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  isPending
                    ? "bg-forest-500/15 text-forest-700"
                    : "bg-linen-200 text-charcoal-soft group-hover:bg-forest-500/10 group-hover:text-forest-700"
                }`}
              >
                <o.Icon />
              </span>
              <p className="font-heading text-base font-medium text-charcoal">
                {o.label}
              </p>
              <p className="text-xs text-charcoal-muted">
                {isPending ? "Building…" : o.hint}
              </p>
            </button>
          );
        })}
      </div>

      {/* Vibe — quiet, optional */}
      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-charcoal-muted">
          Vibe (optional)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIBES.map((v) => {
            const isActive = vibe === v.value;
            return (
              <button
                key={v.value || "none"}
                type="button"
                onClick={() => setVibe(v.value)}
                disabled={anyPending}
                className={`rounded-full border px-4 py-1.5 text-xs transition-colors disabled:opacity-60 ${
                  isActive
                    ? "border-forest-500 bg-forest-500 text-linen-100"
                    : "border-linen-300 bg-linen-50 text-charcoal-soft hover:border-forest-500"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
