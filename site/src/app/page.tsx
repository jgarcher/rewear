import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://rewear-app-one.vercel.app";

const PILLARS = [
  {
    n: "01",
    title: "Wardrobe",
    body: "Photograph what you own. AI auto-tags type, colour, season — so you don't have to type a thing.",
  },
  {
    n: "02",
    title: "Outfits",
    body: "Tap one button and the AI builds an outfit from your closet. Shuffle till it's right. Wear it. Streak +1.",
  },
  {
    n: "03",
    title: "Friends",
    body: "Share, lend and gift between people you actually know. No money. No marketplace. Just your circle.",
  },
  {
    n: "04",
    title: "Schedule",
    body: "Plan a week or a whole holiday. AI fills the days, packing list builds itself, no twin tops at the wedding.",
  },
  {
    n: "05",
    title: "Impact",
    body: "Every re-wear counted. Litres of water, kilos of CO₂, garments delayed from landfill. Sourced, transparent.",
  },
];

const FACTS = [
  {
    fact:
      "The average garment is worn between 7 and 10 times before being discarded.",
    source: "Ellen MacArthur Foundation, 2017",
  },
  {
    fact:
      "Extending the life of a garment by just 9 months reduces its carbon, water, and waste footprints by around 20–30%.",
    source: "WRAP UK, 2017",
  },
  {
    fact:
      "Around 30% of clothes in UK wardrobes haven't been worn for at least a year.",
    source: "WRAP UK, 2017",
  },
];

const SCREENSHOTS: Array<{
  src: string;
  alt: string;
  caption: string;
}> = [
  {
    src: "/screenshots/home.png",
    alt: "ReWear home screen with streak widget",
    caption: "The daily ritual — log today's outfit in one tap.",
  },
  {
    src: "/screenshots/outfit.png",
    alt: "AI outfit suggestion",
    caption: "AI picks from your wardrobe — and your friends'.",
  },
  {
    src: "/screenshots/friends.png",
    alt: "Friends inbox showing pending borrow requests",
    caption: "Borrow from people you trust. No money changes hands.",
  },
  {
    src: "/screenshots/schedule.png",
    alt: "Holiday planner showing a packing list",
    caption: "Plan a holiday. AI fills the days. Packing list builds itself.",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="bg-linen-texture px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <Image
              src="/rewear-logo.png"
              alt="ReWear logo"
              width={140}
              height={140}
              priority
              className="mx-auto mb-10 rounded-2xl"
            />

            <h1 className="font-heading text-5xl font-medium leading-[1.05] tracking-tight text-charcoal sm:text-7xl">
              Open your closet,
              <br />
              <span className="text-forest-700">not another app.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-charcoal-soft sm:text-xl">
              Outfits from your closet — and the closets of friends who let you
              borrow. AI does the picking. You just decide what works. No money,
              no marketplace, no waste.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#waitlist"
                className="rounded-full bg-forest-500 px-8 py-4 text-base font-medium text-linen-100 transition-colors hover:bg-forest-600"
              >
                Join the waitlist
              </Link>
              <Link
                href="#loop"
                className="rounded-full border border-charcoal/15 px-8 py-4 text-base font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
              >
                How it works
              </Link>
            </div>

            <p className="mt-12 font-heading text-base font-medium tracking-wide text-charcoal-muted">
              Wear · Share · Care
            </p>
          </div>
        </section>

        {/* ===== THE LOOP / PILLARS ===== */}
        <section id="loop" className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                Five surfaces, one app
              </p>
              <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
                Everything your closet needs.
                <br />
                Nothing you don&apos;t.
              </h2>
            </div>

            <div className="space-y-px overflow-hidden rounded-3xl border border-linen-200 bg-linen-50">
              {PILLARS.map((step) => (
                <div
                  key={step.n}
                  className="grid grid-cols-1 gap-6 border-b border-linen-200 px-8 py-10 last:border-b-0 sm:grid-cols-[auto_1fr] sm:gap-12 sm:px-12"
                >
                  <p className="font-heading text-3xl font-medium text-forest-500 sm:text-4xl">
                    {step.n}
                  </p>
                  <div>
                    <h3 className="font-heading text-2xl font-medium text-charcoal">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-charcoal-soft sm:text-lg">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== APP PREVIEW ===== */}
        <section className="bg-linen-50 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                A look inside
              </p>
              <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
                What you&apos;re joining the list for.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SCREENSHOTS.map((s) => (
                <figure
                  key={s.src}
                  className="overflow-hidden rounded-2xl border border-linen-200 bg-linen-100"
                >
                  <div className="relative aspect-[9/19.5] w-full bg-linen-200">
                    {/* Screenshot will be loaded from /public/screenshots — placeholders
                        intentionally simple so the page works even before assets exist. */}
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="p-4 text-sm leading-relaxed text-charcoal-soft">
                    {s.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ===== BORROW FROM FRIENDS ===== */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              The differentiator
            </p>
            <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              Borrow from friends, not strangers.
            </h2>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-charcoal-soft sm:text-lg">
              <p>
                Teenagers borrow each other&apos;s clothes. Sisters share
                wardrobes. Housemates raid drawers before nights out. None of it
                requires an app, and none of it requires money. ReWear just makes
                it easier.
              </p>
              <p>
                Connect with friends, mark items <em>borrowable</em> or{" "}
                <em>up for grabs</em>, and see each other&apos;s closets. Ask to
                borrow with one tap. Approved → it lands in their wardrobe with
                a green outline. Returned → it&apos;s back in yours. The whole
                thing is timestamped so nobody forgets.
              </p>
              <p>
                Marketplaces compete on inventory and price. We compete on
                trust. Your friends are your inventory.
              </p>
            </div>
          </div>
        </section>

        {/* ===== HOLIDAY PLANNING ===== */}
        <section className="bg-clay-100/30 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
              Schedule + AI
            </p>
            <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              Plan a week. Plan a whole holiday.
            </h2>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-charcoal-soft sm:text-lg">
              <p>
                Pick a date range, describe the trip in plain English —{" "}
                <em>&ldquo;Greece, mostly beach + long dinners. One nice meal
                out.&rdquo;</em>{" "}
                — and the AI plans an outfit for every day.
              </p>
              <p>
                The packing list builds itself: every unique piece you&apos;ll
                need, sorted by usage so you can spot the items doing the
                heavy lifting. Edit any day individually if the AI gets it
                wrong. Wear-frequency warnings flag if you&apos;ve already
                planned that top three times this week.
              </p>
            </div>
          </div>
        </section>

        {/* ===== MANIFESTO ===== */}
        <section className="bg-forest-700 px-6 py-24 sm:py-32 text-linen-100">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-linen-100/70">
              Why we exist
            </p>
            <div className="mt-6 space-y-6 font-heading text-2xl leading-snug tracking-tight sm:text-3xl">
              <p>Open your closet. There&apos;s nothing to wear.</p>
              <p className="text-linen-100/85">
                It&apos;s a lie your closet&apos;s been telling you for years.
                The truth is, you&apos;ve got hundreds of things in there —
                most of them underused, half-forgotten, occasionally regretted.
                You don&apos;t need more clothes. You need a better way to use
                the ones you already own — and the ones your friends are
                willing to lend.
              </p>
              <p className="text-linen-100/85">
                That&apos;s all ReWear is, really. Outfits from what you have.
                Borrow what you don&apos;t. Gift what you&apos;ve outgrown.
                Donate what you can&apos;t justify keeping. And when you
                <em>do</em> want something new — we&apos;ll point you at brands
                worth buying from.
              </p>
              <p>One closet, your friends&apos; closets, one app.</p>
              <p className="font-heading text-xl tracking-wide text-clay-100/90">
                Wear More. Waste Less. Share More. It&apos;s that simple.
              </p>
            </div>
          </div>
        </section>

        {/* ===== DID YOU KNOW ===== */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                The working theory
              </p>
              <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
                A few things worth knowing.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {FACTS.map((f) => (
                <div
                  key={f.source}
                  className="rounded-2xl border border-linen-200 bg-linen-50 p-8"
                >
                  <p className="text-base leading-relaxed text-charcoal sm:text-lg">
                    {f.fact}
                  </p>
                  <p className="mt-6 text-xs uppercase tracking-wider text-charcoal-muted">
                    {f.source}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/methodology"
                className="prose-link text-charcoal-soft hover:text-forest-700"
              >
                See how we calculate impact →
              </Link>
            </div>
          </div>
        </section>

        {/* ===== WAITLIST ===== */}
        <section
          id="waitlist"
          className="bg-linen-200/60 px-6 py-24 sm:py-32"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Waitlist
            </p>
            <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              We&apos;re building it now.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-charcoal-soft sm:text-lg">
              ReWear is in private build. We&apos;re letting people in slowly
              so it feels right when it lands. Drop your email and we&apos;ll
              be in touch.
            </p>

            <div className="mt-10 flex w-full justify-center">
              <WaitlistForm />
            </div>

            <p className="mt-6 text-xs text-charcoal-muted">
              We collect your email. That&apos;s it. We&apos;ll send one
              message when ReWear&apos;s ready.
            </p>
          </div>
        </section>

        {/* ===== ALREADY A MEMBER ===== */}
        <section className="border-t border-linen-200 bg-linen-50 px-6 py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-heading text-lg font-medium text-charcoal">
                Already on the list?
              </p>
              <p className="mt-1 text-sm text-charcoal-soft">
                Open the app and add to home screen.{" "}
                <span className="hidden sm:inline">
                  On iPhone: Safari → Share → Add to Home Screen.
                </span>
              </p>
            </div>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-forest-500 px-6 py-3 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-500 hover:text-linen-100"
            >
              Open ReWear →
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
