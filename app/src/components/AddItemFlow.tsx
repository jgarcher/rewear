"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  analyzePhotoAction,
  saveItemAction,
} from "@/app/wardrobe/actions";
import { CATEGORY_LABELS, COLOUR_OPTIONS } from "@/lib/types";
import type { AutoTagItem } from "@/lib/anthropic";

const BUCKET = "wardrobe-photos";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const SEASON_OPTIONS = [
  { value: "all", label: "All-season" },
  { value: "winter", label: "Winter" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
];

const OCCASION_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "work", label: "Work" },
  { value: "evening", label: "Evening" },
  { value: "athletic", label: "Athletic" },
  { value: "special", label: "Special" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "analyzing"; photoUrl: string }
  | {
      kind: "review";
      photoUrl: string;
      items: AutoTagItem[]; // suggestions, one per detected item; possibly fallback []
      currentIndex: number;
      caption: string;
      warnings: string[];
      manualFallback: boolean;
    }
  | { kind: "error"; message: string };

export function AddItemFlow() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [savingTransition, startSaving] = useTransition();
  const [sessionAdded, setSessionAdded] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [justAddedFlash, setJustAddedFlash] = useState<string | null>(null);

  function reset() {
    setPhase({ kind: "idle" });
  }

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      setPhase({
        kind: "error",
        message: "Photo's a bit big — keep it under 10 MB.",
      });
      return;
    }

    setPhase({ kind: "uploading" });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhase({
        kind: "error",
        message: "Your session expired — sign in and try again.",
      });
      return;
    }

    // Use a UUID for the storage path; this isn't tied to any one item id —
    // multiple items detected in this photo will all reference this URL.
    const photoFileId = crypto.randomUUID();
    const ext =
      file.name.split(".").pop()?.toLowerCase() ||
      file.type.split("/")[1] ||
      "jpg";
    const path = `${user.id}/${photoFileId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setPhase({
        kind: "error",
        message: `Upload failed: ${uploadError.message}`,
      });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    setPhase({ kind: "analyzing", photoUrl: publicUrl });

    try {
      const result = await analyzePhotoAction(publicUrl);
      const items = result.recognised && result.items.length > 0 ? result.items : [];
      setPhase({
        kind: "review",
        photoUrl: publicUrl,
        items: items.length > 0 ? items : [emptyItem()],
        currentIndex: 0,
        caption: result.caption,
        warnings: result.warnings ?? [],
        manualFallback: items.length === 0,
      });
    } catch (err) {
      console.error("Auto-tag failed:", err);
      setPhase({
        kind: "review",
        photoUrl: publicUrl,
        items: [emptyItem()],
        currentIndex: 0,
        caption: "We couldn't read that one — fill in the basics?",
        warnings: [],
        manualFallback: true,
      });
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset the input so picking the same file again triggers change
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase.kind !== "review") return;
    const formData = new FormData(e.currentTarget);

    startSaving(async () => {
      try {
        const result = await saveItemAction(formData);
        const newAdded = [
          ...sessionAdded,
          { id: result.itemId, name: result.name },
        ];
        setSessionAdded(newAdded);
        setJustAddedFlash(result.name);

        if (phase.kind !== "review") return;
        // Advance through detected items, or back to idle if last
        if (phase.currentIndex < phase.items.length - 1) {
          setPhase({
            ...phase,
            currentIndex: phase.currentIndex + 1,
          });
        } else {
          setPhase({ kind: "idle" });
        }

        // Auto-clear flash after a few seconds
        setTimeout(() => setJustAddedFlash(null), 4000);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't save — try again?";
        setPhase({ kind: "error", message });
      }
    });
  }

  function handleSkipItem() {
    if (phase.kind !== "review") return;
    if (phase.currentIndex < phase.items.length - 1) {
      setPhase({ ...phase, currentIndex: phase.currentIndex + 1 });
    } else {
      reset();
    }
  }

  // === RENDER ===

  // Persistent session ribbon (always shown when items have been added)
  const sessionRibbon = sessionAdded.length > 0 && (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-forest-50 px-5 py-3">
      <p className="text-sm text-forest-700">
        <span className="font-medium">{sessionAdded.length}</span> added in this
        session
      </p>
      <Link
        href="/wardrobe"
        className="text-xs uppercase tracking-wider text-forest-700 hover:text-forest-600"
      >
        Done — view all →
      </Link>
    </div>
  );

  if (phase.kind === "idle") {
    return (
      <div>
        {sessionRibbon}

        {justAddedFlash && (
          <div className="mb-6 rounded-2xl border border-sage-100 bg-sage-100/50 px-5 py-4 text-center">
            <p className="font-heading text-lg text-charcoal">
              Added {justAddedFlash}.
            </p>
            <p className="mt-1 text-sm text-sage-600">
              Keep going — pick another photo below.
            </p>
          </div>
        )}

        <div className="rounded-3xl border-2 border-dashed border-linen-300 bg-linen-50 p-10 text-center">
          <p className="font-heading text-2xl font-medium text-charcoal">
            {sessionAdded.length === 0 ? "Snap it in." : "Got another?"}
          </p>
          <p className="mt-3 text-base text-charcoal-soft">
            One photo can be one item or many — a flat lay, a hanger shot, or a
            selfie. We'll figure out what's in it.
          </p>

          <label className="mt-8 inline-block cursor-pointer rounded-full bg-forest-500 px-6 py-3 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600">
            Pick a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              className="sr-only"
            />
          </label>

          <p className="mt-4 text-xs text-charcoal-muted">
            Bright, neutral background works best. JPG or PNG, up to 10 MB.
          </p>
        </div>
      </div>
    );
  }

  if (phase.kind === "uploading" || phase.kind === "analyzing") {
    const label =
      phase.kind === "uploading"
        ? "Uploading the photo…"
        : "Looking at the photo…";
    return (
      <div>
        {sessionRibbon}
        <div className="rounded-3xl border border-linen-200 bg-linen-50 p-12 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-forest-100" />
          <p className="mt-6 font-heading text-xl text-charcoal">{label}</p>
          <p className="mt-2 text-sm text-charcoal-muted">
            {phase.kind === "analyzing"
              ? "Spotting items, matching colours…"
              : "Won't be long."}
          </p>
        </div>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div>
        {sessionRibbon}
        <div className="rounded-2xl border border-error/30 bg-error/5 p-6">
          <p className="text-base text-error">{phase.message}</p>
          <button
            onClick={reset}
            className="mt-4 rounded-full bg-forest-500 px-6 py-2 text-sm font-medium text-linen-100 hover:bg-forest-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // phase.kind === "review"
  const total = phase.items.length;
  const isMulti = total > 1;
  const currentItem = phase.items[phase.currentIndex];
  const itemId = useStableItemId(phase.photoUrl, phase.currentIndex);

  return (
    <div>
      {sessionRibbon}

      <form onSubmit={handleSubmit} className="space-y-6" key={itemId}>
        <input type="hidden" name="item_id" value={itemId} />
        <input type="hidden" name="photo_url" value={phase.photoUrl} />

        {/* Photo + caption (only shown for first item or as anchor) */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-linen-200">
            <Image
              src={phase.photoUrl}
              alt="Your item"
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
            />
            {isMulti && (
              <div className="absolute right-3 top-3 rounded-full bg-charcoal/80 px-3 py-1 text-xs uppercase tracking-wider text-linen-100">
                Item {phase.currentIndex + 1} of {total}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-forest-100 bg-forest-50 px-5 py-4">
            <p className="font-heading text-lg text-charcoal sm:text-xl">
              {phase.caption}
            </p>
            <p className="mt-2 text-xs text-charcoal-muted">
              {phase.manualFallback
                ? "Fill in what you can — the AI couldn't read this clearly."
                : isMulti
                ? "Edit each one before saving — or skip ones you don't want to add."
                : "Edit anything we got wrong."}
            </p>
          </div>

          {phase.warnings.length > 0 && (
            <div className="rounded-xl border border-clay-100 bg-clay-100/40 px-4 py-3 text-sm text-charcoal-soft">
              {phase.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
        </div>

        {/* Form fields for current item */}
        <div className="space-y-5 pt-2">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-charcoal"
            >
              Name <span className="text-error">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={currentItem?.suggested_name ?? ""}
              placeholder="Forest-green knit jumper"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-charcoal"
              >
                Category <span className="text-error">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                defaultValue={currentItem?.category ?? ""}
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                <option value="" disabled>
                  Pick one
                </option>
                {(
                  Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>
                ).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="primary_colour"
                className="block text-sm font-medium text-charcoal"
              >
                Colour <span className="text-error">*</span>
              </label>
              <select
                id="primary_colour"
                name="primary_colour"
                required
                defaultValue={currentItem?.primary_colour ?? ""}
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                <option value="" disabled>
                  Pick one
                </option>
                {COLOUR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-charcoal"
              >
                Brand <span className="text-charcoal-muted">(optional)</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                maxLength={120}
                defaultValue={currentItem?.brand ?? ""}
                placeholder="Cos"
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
            </div>
            <div>
              <label
                htmlFor="subcategory"
                className="block text-sm font-medium text-charcoal"
              >
                Style <span className="text-charcoal-muted">(optional)</span>
              </label>
              <input
                id="subcategory"
                name="subcategory"
                type="text"
                maxLength={80}
                defaultValue={currentItem?.subcategory ?? ""}
                placeholder="knit jumper"
                className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="material"
              className="block text-sm font-medium text-charcoal"
            >
              Material <span className="text-charcoal-muted">(optional)</span>
            </label>
            <input
              id="material"
              name="material"
              type="text"
              maxLength={80}
              defaultValue={currentItem?.material ?? ""}
              placeholder="merino wool"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-charcoal">
              Seasons
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SEASON_OPTIONS.map((opt) => (
                <SuggestionChip
                  key={opt.value}
                  name="seasons"
                  value={opt.value}
                  label={opt.label}
                  defaultChecked={
                    currentItem?.seasons?.includes(opt.value as never) ?? false
                  }
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-charcoal">
              Occasions
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASION_OPTIONS.map((opt) => (
                <SuggestionChip
                  key={opt.value}
                  name="occasions"
                  value={opt.value}
                  label={opt.label}
                  defaultChecked={
                    currentItem?.occasions?.includes(opt.value as never) ?? false
                  }
                />
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-charcoal"
            >
              Notes <span className="text-charcoal-muted">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              maxLength={500}
              placeholder="The colour everyone compliments"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <button
            type="submit"
            disabled={savingTransition}
            className="flex-1 rounded-full bg-forest-500 px-6 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
          >
            {savingTransition
              ? "Saving…"
              : isMulti && phase.currentIndex < total - 1
              ? `Save & next (${phase.currentIndex + 1}/${total})`
              : isMulti
              ? `Save final item (${total}/${total})`
              : "Add to wardrobe"}
          </button>

          {isMulti && (
            <button
              type="button"
              onClick={handleSkipItem}
              disabled={savingTransition}
              className="rounded-full border border-charcoal/15 px-6 py-4 text-base text-charcoal-soft transition-colors hover:border-clay-500 hover:text-clay-600 sm:flex-shrink-0"
            >
              Skip this one
            </button>
          )}

          <button
            type="button"
            onClick={reset}
            disabled={savingTransition}
            className="rounded-full border border-charcoal/15 px-6 py-4 text-base text-charcoal-soft transition-colors hover:border-error hover:text-error sm:flex-shrink-0"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function SuggestionChip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-block rounded-full border border-linen-300 bg-linen-50 px-4 py-2 text-sm text-charcoal-soft transition-colors peer-checked:border-forest-500 peer-checked:bg-forest-500 peer-checked:text-linen-100 hover:border-forest-500">
        {label}
      </span>
    </label>
  );
}

// Generates a stable item-id per (photo, index) pair so re-renders during
// review don't change the hidden input. Uses a deterministic string seed.
function useStableItemId(photoUrl: string, index: number): string {
  // Pull last segment of the URL (UUID + ext) and hash with index for uniqueness.
  // crypto.randomUUID() would change every render — that's wrong here.
  const seed = `${photoUrl}|${index}`;
  // Convert seed → UUID-like string deterministically.
  return uuidFromString(seed);
}

function uuidFromString(seed: string): string {
  // Simple deterministic 32-hex from FNV-1a-ish hashing, formatted as UUID v4-like.
  // Not cryptographically secure — fine for client-side row IDs (validated server-side).
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x9e3779b1) >>> 0;
  }
  const hex = (n: number, len: number) =>
    n.toString(16).padStart(len, "0").slice(0, len);
  // Build a v4-shaped UUID. 4xxx for version, 8/9/a/b for variant.
  return `${hex(h1, 8)}-${hex(h2 >>> 16, 4)}-4${hex(h2 & 0xfff, 3)}-8${hex(
    h1 >>> 16,
    3
  )}-${hex(h1 & 0xffff, 4)}${hex(h2, 8)}`;
}

function emptyItem(): AutoTagItem {
  return {
    suggested_name: null,
    category: null,
    subcategory: null,
    primary_colour: null,
    secondary_colour: null,
    brand: null,
    material: null,
    seasons: [],
    occasions: [],
  };
}
