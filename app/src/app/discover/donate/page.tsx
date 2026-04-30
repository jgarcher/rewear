import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Donate — ReWear" };

type Location = {
  id: string;
  partner_name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  accepts: string[];
  notes: string | null;
};

export default async function DonatePage() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("donation_locations")
    .select("id, partner_name, address, lat, lng, accepts, notes")
    .order("partner_name");

  const list = (locations ?? []) as Location[];

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/discover"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Discover
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-sage-600">
          Donate
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Find a home for what you can't keep.
        </h1>
        <p className="mt-3 text-base text-charcoal-soft sm:text-lg">
          Drop-off points around Amstelveen and Amsterdam. Map view coming
          soon — for now, browse the list.
        </p>

        {list.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 p-10 text-center">
            <p className="text-base text-charcoal-soft">
              We're collecting locations near you. Back soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {list.map((loc) => {
              const mapsHref = loc.lat && loc.lng
                ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                : loc.address
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    loc.address
                  )}`
                : null;

              return (
                <div
                  key={loc.id}
                  className="rounded-2xl border border-linen-200 bg-linen-50 p-6"
                >
                  <h2 className="font-heading text-xl font-medium text-charcoal">
                    {loc.partner_name}
                  </h2>
                  {loc.address && (
                    <p className="mt-1 text-sm text-charcoal-muted">
                      {loc.address}
                    </p>
                  )}

                  {loc.accepts && loc.accepts.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {loc.accepts.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-sage-600"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {loc.notes && (
                    <p className="mt-4 text-sm leading-relaxed text-charcoal-soft">
                      {loc.notes}
                    </p>
                  )}

                  {mapsHref && (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-4 inline-block text-sm text-forest-700 hover:underline"
                    >
                      Open in Maps →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 px-6 py-5 text-sm text-charcoal-soft">
          <p>
            <strong className="text-charcoal">Before you donate:</strong>{" "}
            check the items are clean, in wearable condition, and not items
            that would be better resold or upcycled. Charity shops have to
            pay to dispose of unusable donations.
          </p>
        </div>
      </div>
    </main>
  );
}
