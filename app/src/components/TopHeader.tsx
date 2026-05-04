"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

export function TopHeader() {
  const pathname = usePathname();

  // Hide on auth + public landing routes
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/invite/")
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-linen-200 bg-linen-100/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-end px-6 py-3">
        <Link
          href="/"
          aria-label="ReWear home"
          className="transition-opacity hover:opacity-80"
        >
          <Logo size={32} showWordmark={false} />
        </Link>
      </div>
    </header>
  );
}
