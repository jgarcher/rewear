"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Logo } from "@/components/Logo";
import { magicOutfitAction } from "@/app/outfit/actions";

export function TopHeader() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Hide on auth + public landing routes
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/invite/")
  ) {
    return null;
  }

  function handleMagic() {
    if (pending) return;
    startTransition(async () => {
      try {
        await magicOutfitAction();
      } catch {
        // Server action redirects; if we land here, the redirect threw a
        // synthetic error which is the success path. Swallow.
      }
    });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-linen-200 bg-linen-100/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
        {/* Wordmark + tagline */}
        <Link href="/" className="min-w-0 leading-tight">
          <p className="font-heading text-lg font-medium tracking-tight text-charcoal sm:text-xl">
            ReWear
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal-muted sm:text-xs">
            Wear · Share · Care
          </p>
        </Link>

        {/* Magic logo button */}
        <button
          type="button"
          onClick={handleMagic}
          disabled={pending}
          aria-label="Generate a surprise outfit"
          title="Tap for a surprise outfit"
          className="group relative shrink-0 rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          <span
            className={`block ${pending ? "rw-flame" : ""}`}
            aria-hidden
          >
            <Logo size={48} showWordmark={false} />
          </span>
          {/* Subtle pulse ring to hint interactivity */}
          {!pending && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-forest-500/0 transition-all group-hover:ring-forest-500/40"
            />
          )}
          {/* Loading dot */}
          {pending && (
            <span
              aria-hidden
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-forest-500 px-2 py-0.5 text-[10px] font-medium text-linen-100 shadow"
            >
              ✨
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
