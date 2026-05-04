"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvite } from "@/app/friends/actions";

type Props = { code: string };

export function AcceptInviteButton({ code }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await acceptInvite(code);
        router.push(`/friends?welcome=${encodeURIComponent(result.inviter_id)}`);
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Couldn't accept";
        // Surface postgres exception names with friendlier copy
        const msg = raw.includes("invite_already_used")
          ? "This invite has already been used."
          : raw.includes("invite_expired")
          ? "This invite has expired. Ask your friend for a new link."
          : raw.includes("cannot_self_accept")
          ? "You can't accept your own invite."
          : raw.includes("invite_not_found")
          ? "We couldn't find this invite."
          : raw;
        setError(msg);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
      >
        {pending ? "Connecting…" : "Accept invitation"}
      </button>
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </div>
  );
}
