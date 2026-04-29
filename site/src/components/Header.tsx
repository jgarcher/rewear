import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#loop", label: "How it works" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="w-full border-b border-linen-200/60 bg-linen-100/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <Logo size={36} />

        <nav className="hidden items-center gap-8 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-charcoal-soft transition-colors hover:text-forest-700"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#waitlist"
            className="rounded-full bg-forest-500 px-5 py-2 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
          >
            Join the waitlist
          </Link>
        </nav>

        {/* Mobile: just the join CTA — full nav lives in footer */}
        <Link
          href="/#waitlist"
          className="rounded-full bg-forest-500 px-4 py-2 text-sm font-medium text-linen-100 sm:hidden"
        >
          Join
        </Link>
      </div>
    </header>
  );
}
