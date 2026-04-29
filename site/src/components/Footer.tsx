import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-linen-200 bg-linen-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="font-heading text-2xl font-medium tracking-tight text-charcoal">
            Wear More. Waste Less.
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-charcoal-soft">
            <Link href="/" className="hover:text-forest-700">
              Home
            </Link>
            <Link href="/#loop" className="hover:text-forest-700">
              How it works
            </Link>
            <Link href="/methodology" className="hover:text-forest-700">
              Methodology
            </Link>
            <Link href="/about" className="hover:text-forest-700">
              About
            </Link>
            <Link href="/#waitlist" className="hover:text-forest-700">
              Join
            </Link>
          </nav>

          <p className="text-xs text-charcoal-muted">
            © {new Date().getFullYear()} ReWear · Made in London
          </p>
        </div>
      </div>
    </footer>
  );
}
