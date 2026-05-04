"use client";

import { useState, useTransition } from "react";
import { createInviteLink } from "@/app/friends/actions";

type Props = {
  initialCode: string | null;
};

export function InviteShareCard({ initialCode }: Props) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url =
    code && typeof window !== "undefined"
      ? `${window.location.origin}/invite/${code}`
      : null;

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await createInviteLink();
        setCode(r.code);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't create");
      }
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — fall back to manual selection
    }
  }

  async function share() {
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join me on ReWear",
          text: "I'd love to share my closet with you. Tap to connect.",
          url,
        });
      } catch {
        // user cancelled or unsupported — silent
      }
    } else {
      copy();
    }
  }

  if (!code) {
    return (
      <div className="rounded-3xl border border-linen-200 bg-linen-50 p-6 sm:p-8">
        <p className="font-heading text-xl font-medium text-charcoal sm:text-2xl">
          Get a link, send to a friend.
        </p>
        <p className="mt-2 text-sm text-charcoal-soft">
          One tap and they&apos;re in your circle. Links expire after 14 days.
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="mt-5 rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate invite link"}
        </button>
        {error && <p className="mt-3 text-xs text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-linen-200 bg-linen-50 p-6 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
        Your invite link
      </p>
      <p className="mt-3 break-all rounded-2xl border border-linen-200 bg-linen-100 px-4 py-3 font-mono text-sm text-charcoal">
        {url}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={share}
          className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
        >
          Share
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700 disabled:opacity-60"
        >
          {pending ? "…" : "New link"}
        </button>
      </div>
      <p className="mt-4 text-xs text-charcoal-muted">
        Expires in 14 days. One-time use.
      </p>
      {error && <p className="mt-3 text-xs text-error">{error}</p>}
    </div>
  );
}
