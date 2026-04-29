import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "About — ReWear",
  description:
    "ReWear started as a school project. It became something we couldn't put down.",
};

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="flex-1 px-6 py-16 sm:py-24">
        <article className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
            About
          </p>
          <h1 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            We started this in a classroom.
          </h1>

          <div className="mt-10 space-y-8 text-lg leading-relaxed text-charcoal-soft sm:text-xl">
            <p>
              ReWear began as a school project. The brief was simple: build
              something that solves a real problem. The first sketch was a
              wardrobe app that helps people wear what they own — not because
              it's noble, but because it's annoying to stand in front of a full
              closet at 8am with nothing to wear.
            </p>

            <p>
              The further we got, the bigger it became. Wardrobe tracking was
              just the start. People needed to do something with the things they
              don't wear: restyle, resell, donate. They needed help finding
              brands worth buying from when they did want something new. They
              needed all of that without juggling Pinterest, Vinted, YouTube and
              Google Maps. That's the everything wardrobe.
            </p>

            <p>
              We're building it now. Slowly, deliberately, with people we trust
              testing every step. We want it to feel right before it lands.
            </p>
          </div>

          {/* Manifesto pull-quote block */}
          <section className="mt-20 rounded-3xl bg-forest-700 px-8 py-12 text-linen-100 sm:px-12 sm:py-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-linen-100/70">
              Why we exist
            </p>
            <div className="mt-6 space-y-5 font-heading text-2xl leading-snug tracking-tight sm:text-3xl">
              <p>Open your closet. There's nothing to wear.</p>
              <p className="text-linen-100/85">
                It's a lie your closet's been telling you for years. The truth
                is, you've got hundreds of things in there — most of them
                underused, half-forgotten, occasionally regretted.
              </p>
              <p className="text-linen-100/85">
                You don't need more clothes. You need a better way to use the
                ones you already own.
              </p>
              <p>One closet. One app. The whole thing.</p>
              <p className="font-heading text-xl tracking-wide text-clay-100/90">
                Wear More. Waste Less.
              </p>
            </div>
          </section>

          {/* Principles */}
          <section className="mt-20">
            <h2 className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              How we work
            </h2>
            <div className="mt-8 space-y-6">
              {[
                {
                  title: "Conservative over impressive",
                  body:
                    "Every impact figure on this site is a deliberately cautious estimate from peer-reviewed sources. We'd rather under-claim than over-claim.",
                },
                {
                  title: "Anti-preachy",
                  body:
                    "We don't tell you fast fashion is bad. We help you wear what you already own, and let the data speak.",
                },
                {
                  title: "Built in the open",
                  body:
                    "Decisions, methodology, source citations — all visible. If something looks wrong, you can tell us, and we'll fix it.",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-linen-200 bg-linen-50 px-8 py-6"
                >
                  <h3 className="font-heading text-xl font-medium text-charcoal">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-charcoal-soft sm:text-lg">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-20 text-center">
            <p className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              Want in early?
            </p>
            <Link
              href="/#waitlist"
              className="mt-6 inline-block rounded-full bg-forest-500 px-8 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Join the waitlist
            </Link>
          </section>
        </article>
      </main>

      <Footer />
    </>
  );
}
