"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/outfit", label: "Outfit" },
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth routes — root layout still renders us, we self-hide.
  if (pathname.startsWith("/signin") || pathname.startsWith("/auth/")) {
    return null;
  }

  return (
    <nav className="sticky bottom-0 z-10 border-t border-linen-200 bg-linen-50/95 backdrop-blur-sm">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-2 py-3 text-xs transition-colors ${
                  active
                    ? "text-forest-700"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <span
                  className={`h-1 w-6 rounded-full transition-colors ${
                    active ? "bg-forest-500" : "bg-transparent"
                  }`}
                />
                <span className="font-medium tracking-wide">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
