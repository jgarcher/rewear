import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";

const LOOP = [
  {
    n: "01",
    title: "Track",
    body: "Photograph what you own. We auto-tag it — type, colour, season — so you don't have to.",
  },
  {
    n: "02",
    title: "Outfit",
    body: "Every morning, a complete outfit from your wardrobe. We prioritise the pieces you've forgotten.",
  },
  {
    n: "03",
    title: "Restyle",
    body: "Upcycle tutorials paired to your actual items. Three things you could do with the jumper you've worn out.",
  },
  {
    n: "04",
    title: "Resell",
    body: "List what you no longer wear. Browse what your neighbours have let go of. No new packaging, no new factories.",
  },
  {
    n: "05",
    title: "Donate",
    body: "Find the nearest place that takes the things you can't keep. Every drawer eventually empties — let's do it kindly.",
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
              The everything wardrobe. Outfits from what you already own, restyling,
              reselling, donating, eco-brand discovery — all in one place. Instead
              of five.
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
              Wear More. Waste Less.
            </p>
          </div>
        </section>

        {/* ===== THE LOOP ===== */}
        <section id="loop" className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
                The Loop
              </p>
              <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
                Five things your closet needs.
                <br />
                One app.
              </h2>
            </div>

            <div className="space-y-px overflow-hidden rounded-3xl border border-linen-200 bg-linen-50">
              {LOOP.map((step) => (
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

        {/* ===== MANIFESTO ===== */}
        <section className="bg-forest-700 px-6 py-24 sm:py-32 text-linen-100">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-linen-100/70">
              Why we exist
            </p>
            <div className="mt-6 space-y-6 font-heading text-2xl leading-snug tracking-tight sm:text-3xl">
              <p>Open your closet. There's nothing to wear.</p>
              <p className="text-linen-100/85">
                It's a lie your closet's been telling you for years. The truth is,
                you've got hundreds of things in there — most of them underused,
                half-forgotten, occasionally regretted. You don't need more
                clothes. You need a better way to use the ones you already own.
              </p>
              <p className="text-linen-100/85">
                That's all ReWear is, really. Outfits from what you have. Restyle
                the bits you're bored of. Resell what no longer fits. Donate what
                you can't justify keeping. And when you do want something new —
                we'll point you at brands worth buying from.
              </p>
              <p>One closet. One app. The whole thing.</p>
              <p className="font-heading text-xl tracking-wide text-clay-100/90">
                Wear More. Waste Less. It's that simple — and that satisfying.
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
              We're building it now.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-charcoal-soft sm:text-lg">
              ReWear is in private build. We're letting people in slowly so it
              feels right when it lands. Drop your email — we'll be in touch.
            </p>

            <div className="mt-10 flex w-full justify-center">
              <WaitlistForm />
            </div>

            <p className="mt-6 text-xs text-charcoal-muted">
              No spam. No newsletter. Just one email when ReWear's ready.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
