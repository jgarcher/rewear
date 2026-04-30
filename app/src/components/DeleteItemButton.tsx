"use client";

import { useTransition } from "react";
import { deleteItem } from "@/app/wardrobe/actions";

type Props = { itemId: string; itemName: string };

export function DeleteItemButton({ itemId, itemName }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete "${itemName}"? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteItem(itemId);
      } catch (e) {
        console.error(e);
        alert("Couldn't delete — try again?");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-charcoal-muted transition-colors hover:text-error disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete this item"}
    </button>
  );
}
