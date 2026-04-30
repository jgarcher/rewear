"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  analyzePhotoAction,
  saveItemAction,
} from "@/app/wardrobe/actions";
import { CATEGORY_LABELS, COLOUR_OPTIONS } from "@/lib/types";
import type { AutoTagResult } from "@/lib/anthropic";

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
  | { kind: "uploading"; progressLabel: string }
  | { kind: "analyzing"; photoUrl: string; itemId: string }
  | {
      kind: "review";
      photoUrl: string;
      itemId: string;
      suggestions: AutoTagResult | null;
      manualFallback: boolean;
    }
  | { kind: "error"; message: string };

export function AddItemFlow() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [savingTransition, startSaving] = useTransition();

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      setPhase({
        kind: "error",
        message: "Photo's a bit big — keep it under 10 MB.",
      });
      return;
    }

    setPhase({ kind: "uploading", progressLabel: "Uploading the photo…" });

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

    const itemId = crypto.randomUUID();
    const ext =
      file.name.split(".").pop()?.toLowerCase() ||
      file.type.split("/")[1] ||
      "jpg";
    const path = `${user.id}/${itemId}.${ext}`;

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

    setPhase({ kind: "analyzing", photoUrl: publicUrl, itemId });

    try {
      const suggestions = await analyzePhotoAction(publicUrl);
      setPhase({
        kind: "review",
        photoUrl: publicUrl,
        itemId,
        suggestions,
        manualFallback: false,
      });
    } catch (err) {
      console.error("Auto-tag failed:", err);
      setPhase({
        kind: "review",
        photoUrl: publicUrl,
        itemId,
        suggestions: null,
        manualFallback: true,
      });
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startSaving(async () => {
      try {
        await saveItemAction(formData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't save — try again?";
        if (message.includes("NEXT_REDIRECT")) return;
        setPhase({ kind: "error", message });
      }
    });
  }

  // === RENDER ===

  if (phase.kind === "idle") {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border-2 border-dashed border-linen-300 bg-linen-50 p-10 text-center">
          <p className="font-heading text-2xl font-medium text-charcoal">
            Snap it in.
          </p>
          <p className="mt-3 text-base text-charcoal-soft">
            Take a photo of one piece. We'll figure out the rest — type, colour,
            season — and you confirm.
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
        ? phase.progressLabel
        : "Looking at the photo…";
    return (
      <div className="rounded-3xl border border-linen-200 bg-linen-50 p-12 text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-forest-100" />
        <p className="mt-6 font-heading text-xl text-charcoal">{label}</p>
        <p className="mt-2 text-sm text-charcoal-muted">
          {phase.kind === "analyzing" ? "About 5 seconds." : "Won't be long."}
        </p>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/5 p-6">
        <p className="text-base text-error">{phase.message}</p>
        <button
          onClick={() => setPhase({ kind: "idle" })}
          className="mt-4 rounded-full bg-forest-500 px-6 py-2 text-sm font-medium text-linen-100 hover:bg-forest-600"
        >
          Try again
        </button>
      </div>
    );
  }

  // phase.kind === "review"
  const s = phase.suggestions;
  const caption =
    s && s.recognised
      ? s.caption
      : phase.manualFallback
      ? "We couldn't read that one — fill in the basics?"
      : s?.caption ||
        "Couldn't identify it clearly. Fill in what you can.";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="item_id" value={phase.itemId} />
      <input type="hidden" name="photo_url" value={phase.photoUrl} />

      {/* Photo + AI caption */}
      <div className="space-y-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-linen-200">
          <Image
            src={phase.photoUrl}
            alt="Your item"
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
        </div>

        <div className="rounded-2xl border border-forest-100 bg-forest-50 px-5 py-4">
          <p className="font-heading text-lg text-charcoal sm:text-xl">
            {caption}
          </p>
          <p className="mt-2 text-xs text-charcoal-muted">
            Edit anything we got wrong.
          </p>
        </div>

        {s?.warnings && s.warnings.length > 0 && (
          <div className="rounded-xl border border-clay-100 bg-clay-100/40 px-4 py-3 text-sm text-charcoal-soft">
            {s.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="space-y-5 pt-2">
        {/* Name */}
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
            defaultValue={s?.suggested_name ?? ""}
            placeholder="Forest-green knit jumper"
            className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          />
        </div>

        {/* Category + Colour */}
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
              defaultValue={s?.category ?? ""}
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
              defaultValue={s?.primary_colour ?? ""}
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

        {/* Brand + subcategory */}
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
              defaultValue={s?.brand ?? ""}
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
              defaultValue={s?.subcategory ?? ""}
              placeholder="knit jumper"
              className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>
        </div>

        {/* Material */}
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
            defaultValue={s?.material ?? ""}
            placeholder="merino wool"
            className="mt-2 block w-full rounded-xl border border-linen-300 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          />
        </div>

        {/* Seasons (chips) */}
        <fieldset>
          <legend className="text-sm font-medium text-charcoal">Seasons</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEASON_OPTIONS.map((opt) => (
              <SuggestionChip
                key={opt.value}
                name="seasons"
                value={opt.value}
                label={opt.label}
                defaultChecked={s?.seasons.includes(opt.value as never)}
              />
            ))}
          </div>
        </fieldset>

        {/* Occasions (chips) */}
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
                defaultChecked={s?.occasions.includes(opt.value as never)}
              />
            ))}
          </div>
        </fieldset>

        {/* Notes */}
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
          {savingTransition ? "Saving…" : "Add to wardrobe"}
        </button>
        <button
          type="button"
          onClick={() => setPhase({ kind: "idle" })}
          disabled={savingTransition}
          className="rounded-full border border-charcoal/15 px-6 py-4 text-base text-charcoal-soft transition-colors hover:border-error hover:text-error sm:flex-shrink-0"
        >
          Start over
        </button>
      </div>
    </form>
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
