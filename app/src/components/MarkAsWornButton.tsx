"use client";

import { useState, useTransition } from "react";
import { markAsWorn } from "@/app/wardrobe/actions";

type Props = { itemId: string };

export function MarkAsWornButton({ itemId }: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleClick() {
    startTransition(async () => {
      try {
        await markAsWorn(itemId);
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      } catch (e) {
        console.error(e);
        alert("Couldn't mark as worn — try again?");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending || done}
      className="rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
    >
      {pending ? "Logging…" : done ? "Logged ✓" : "Mark as worn today"}
    </button>
  );
}
