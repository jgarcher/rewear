"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function WardrobeIcon({ active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 4v3" />
      <path d="M12 7c-3 1.5-9 4-9 7h18c0-3-6-5.5-9-7Z" />
      <circle cx="12" cy="5" r="1.5" />
    </svg>
  );
}

function FriendsIcon({ active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M15 14c3 0 6 1.5 6 4" />
    </svg>
  );
}

function OutfitIcon({ active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 3v3" />
      <path d="M19 21H5l3-12 4-3 4 3 3 12Z" />
    </svg>
  );
}

function DiscoverIcon({ active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5 13 13l-3.5 1.5L11 11Z" />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

const TABS: Array<{
  href: string;
  label: string;
  Icon: (props: IconProps) => React.ReactNode;
}> = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/wardrobe", label: "Wardrobe", Icon: WardrobeIcon },
  { href: "/friends", label: "Friends", Icon: FriendsIcon },
  { href: "/outfit", label: "Outfit", Icon: OutfitIcon },
  { href: "/discover", label: "Discover", Icon: DiscoverIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
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
    <nav className="sticky bottom-0 z-10 border-t border-linen-200 bg-linen-50/95 backdrop-blur-sm">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`group flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] transition-colors ${
                  active
                    ? "text-forest-700"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    active
                      ? "scale-110 bg-forest-500/10 text-forest-700"
                      : "bg-transparent text-charcoal-muted group-hover:text-charcoal"
                  }`}
                >
                  <tab.Icon active={active} />
                </span>
                <span
                  className={`mt-0.5 font-medium tracking-wide transition-opacity ${
                    active ? "opacity-100" : "opacity-80"
                  }`}
                >
                  {tab.label}
                </span>
                <span
                  className={`mt-0.5 h-0.5 w-1 rounded-full transition-all ${
                    active ? "w-5 bg-forest-500" : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
