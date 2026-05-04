import Image from "next/image";
import Link from "next/link";
import type { WardrobeItem } from "@/lib/types";

type ItemCardProps = {
  item: WardrobeItem;
  wearCount?: number;
  borrowedFrom?: string | null;
};

export function ItemCard({
  item,
  wearCount = 0,
  borrowedFrom = null,
}: ItemCardProps) {
  const isBorrowed = !!borrowedFrom;
  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className={`group block overflow-hidden rounded-2xl border-2 bg-linen-50 transition-colors ${
        isBorrowed
          ? "border-forest-500 ring-2 ring-forest-500/15 hover:border-forest-700"
          : "border-linen-200 hover:border-forest-500"
      }`}
    >
      <div className="relative aspect-square w-full bg-linen-200">
        {item.photo_url ? (
          <Image
            src={item.photo_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-charcoal-placeholder">
            <span className="font-heading text-xs">No photo</span>
          </div>
        )}
        {isBorrowed ? (
          <span className="absolute right-2 top-2 rounded-full bg-forest-500/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-linen-100">
            Borrowed
          </span>
        ) : wearCount === 0 ? (
          <span className="absolute right-2 top-2 rounded-full bg-clay-500/90 px-2 py-0.5 text-xs text-linen-100">
            Never worn
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-charcoal">{item.name}</p>
        <p className="mt-0.5 text-xs text-charcoal-muted">
          {isBorrowed
            ? `From ${borrowedFrom}`
            : wearCount === 0
            ? "Hasn't been worn"
            : `Worn ${wearCount} ${wearCount === 1 ? "time" : "times"}`}
        </p>
      </div>
    </Link>
  );
}
