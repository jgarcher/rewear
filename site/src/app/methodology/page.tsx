import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Methodology — ReWear",
  description:
    "How ReWear calculates the environmental impact of re-wearing clothes you already own. Conservative figures, peer-reviewed sources, full transparency.",
};

const PER_GARMENT = [
  { type: "Cotton t-shirt", water: "~ 2,700 L", co2: "~ 5 kg", source: "WRAP UK / WWF" },
  { type: "Cotton jeans", water: "~ 7,500 L", co2: "~ 10 kg", source: "Levi's published LCA" },
  { type: "Wool jumper", water: "~ 700 L", co2: "~ 28 kg", source: "Higg MSI v3" },
  { type: "Synthetic puffer", water: "~ 100 L", co2: "~ 12 kg", source: "Higg MSI v3" },
  { type: "Linen dress", water: "~ 6,500 L", co2: "~ 4 kg", source: "Higg MSI v3" },
  { type: "Leather shoes", water: "~ 17,000 L", co2: "~ 14 kg", source: "Higg MSI v3" },
];

const SOURCES = [
  {
    title: "Valuing Our Clothes — WRAP UK",
    year: "2017",
    href: "https://wrap.org.uk/resources/report/valuing-our-clothes-cost-uk-fashion",
  },
  {
    title: "Textiles 2030 — WRAP UK",
    year: "ongoing",
    href: "https://wrap.org.uk/taking-action/textiles/initiatives/textiles-2030",
  },
  {
    title: "A New Textiles Economy — Ellen MacArthur Foundation",
    year: "2017",
    href: "https://ellenmacarthurfoundation.org/a-new-textiles-economy",
  },
  {
    title: "Higg Materials Sustainability Index v3 — Sustainable Apparel Coalition",
    year: "2023",
    href: "https://msi.higg.org/",
  },
  {
    title: "Measuring Fashion — UNECE / Quantis",
    year: "2018",
    href: "https://quantis.com/report/measuring-fashion-report/",
  },
  {
    title: "Lifecycle Assessment of Levi's 501",
    year: "2015",
    href: "https://www.levistrauss.com/wp-content/uploads/2015/03/Full-LCA-Results-Deck-FINAL.pdf",
  },
];

export default function MethodologyPage() {
  return (
    <>
      <Header />

      <main className="flex-1 px-6 py-16 sm:py-24">
        <article className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
            Methodology
          </p>
          <h1 className="mt-4 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
            How we calculate impact.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-charcoal-soft sm:text-xl">
            Re-wearing extends a garment's life. We use conservative, peer-reviewed
            industry data to estimate the resulting environmental savings — and
            show our working, every step.
          </p>

          {/* TL;DR */}
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              The TL;DR
            </h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Every ~20 re-wears delays roughly one new garment purchase. Each
              delayed garment carries a measurable footprint — water, carbon,
              waste. We multiply, round generously, attribute every figure to a
              source, and never claim eliminated impact. Garments do eventually
              get replaced; we slow the cycle, we don't stop it.
            </p>
          </section>

          {/* The heuristic */}
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              Why 20 re-wears = 1 garment delayed
            </h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal-soft sm:text-lg">
              The average UK person buys around 26 garments a year (
              <a
                href="https://wrap.org.uk/taking-action/textiles/initiatives/textiles-2030"
                className="prose-link"
                target="_blank"
                rel="noreferrer"
              >
                WRAP UK
              </a>
              ). The average garment is worn 7–10 times before being discarded (
              <a
                href="https://ellenmacarthurfoundation.org/a-new-textiles-economy"
                className="prose-link"
                target="_blank"
                rel="noreferrer"
              >
                Ellen MacArthur Foundation
              </a>
              ). Re-wearing what you already own doesn't <em>eliminate</em> future
              purchases — it <em>delays</em> them. The 20:1 ratio is a deliberately
              cautious estimate. We could claim 7:1 and produce more impressive
              numbers, but that wouldn't survive challenge. Conservative wins.
            </p>
          </section>

          {/* Per-garment averages */}
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              Per-garment estimates
            </h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Lifecycle footprint varies massively by fibre, manufacturing
              country, and end-of-life. Here's the data we use, weighted into the
              averages on your home screen.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-linen-200 bg-linen-50">
              <table className="w-full text-sm">
                <thead className="border-b border-linen-200 bg-linen-100">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-charcoal sm:px-6">Garment</th>
                    <th className="px-4 py-3 font-medium text-charcoal sm:px-6">Water</th>
                    <th className="px-4 py-3 font-medium text-charcoal sm:px-6">CO₂</th>
                    <th className="hidden px-4 py-3 font-medium text-charcoal sm:table-cell sm:px-6">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PER_GARMENT.map((row, i) => (
                    <tr
                      key={row.type}
                      className={
                        i < PER_GARMENT.length - 1
                          ? "border-b border-linen-200"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 text-charcoal sm:px-6">{row.type}</td>
                      <td className="px-4 py-3 text-charcoal-soft sm:px-6">{row.water}</td>
                      <td className="px-4 py-3 text-charcoal-soft sm:px-6">{row.co2}</td>
                      <td className="hidden px-4 py-3 text-xs text-charcoal-muted sm:table-cell sm:px-6">
                        {row.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-base leading-relaxed text-charcoal-soft">
              Weighted across a realistic mixed wardrobe, we use{" "}
              <strong className="text-charcoal">~ 3,000 L water</strong> and{" "}
              <strong className="text-charcoal">~ 10 kg CO₂</strong> per delayed
              garment. Round numbers, because precision is dishonest at this
              granularity.
            </p>
          </section>

          {/* What we don't claim */}
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              What we deliberately don't claim
            </h2>
            <ul className="mt-4 space-y-3 text-base leading-relaxed text-charcoal-soft sm:text-lg">
              <li>
                <strong className="text-charcoal">Eliminated impact.</strong>{" "}
                Garments eventually get replaced. We slow the cycle, we don't
                stop it.
              </li>
              <li>
                <strong className="text-charcoal">Microplastic numbers.</strong>{" "}
                They matter, but per-wear quantification is hard. We mention them
                in the feed; we don't claim them in the tracker.
              </li>
              <li>
                <strong className="text-charcoal">Transport, packaging,
                  dry-cleaning emissions.</strong> Out of scope for V1. Future
                versions may add them.
              </li>
              <li>
                <strong className="text-charcoal">Per-fibre precision.</strong>{" "}
                We use a weighted average across a typical mixed wardrobe. Real
                impact is fibre-specific.
              </li>
            </ul>
          </section>

          {/* Sources */}
          <section className="mt-16">
            <h2 className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              Primary sources
            </h2>
            <ul className="mt-4 space-y-2">
              {SOURCES.map((s) => (
                <li key={s.title} className="text-base text-charcoal-soft">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="prose-link"
                  >
                    {s.title}
                  </a>{" "}
                  <span className="text-charcoal-muted">— {s.year}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Closing */}
          <section className="mt-16 rounded-2xl border border-linen-200 bg-linen-50 px-8 py-10">
            <p className="text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Found a flaw in our maths? Spotted a better source? Tell us — we'll
              update the methodology and credit you. The goal is honesty, not
              looking impressive.
            </p>
            <Link
              href="/#waitlist"
              className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Get in touch
            </Link>
          </section>
        </article>
      </main>

      <Footer />
    </>
  );
}
