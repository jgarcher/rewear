import { createClient } from "@/lib/supabase/server";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware redirects unauthenticated users — this is a fallback.
  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <main className="flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Today
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
          {greeting()}, {name}.
        </h1>

        {/* Outfit-of-the-day placeholder */}
        <div className="mt-12 rounded-3xl border border-linen-200 bg-linen-50 p-10 text-center">
          <p className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
            Today's outfit lives here.
          </p>
          <p className="mt-4 text-base leading-relaxed text-charcoal-soft sm:text-lg">
            Add a few wardrobe items first — then we'll start building outfits.
          </p>
        </div>

        {/* Quick stats placeholder */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Streak", value: "0 days" },
            { label: "Items", value: "0" },
            { label: "Re-wears", value: "0" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-linen-200 bg-linen-50 p-6 text-center"
            >
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                {s.label}
              </p>
              <p className="mt-2 font-heading text-2xl font-medium text-charcoal">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.2em] text-charcoal-muted">
          Wear More. Waste Less.
        </p>
      </div>
    </main>
  );
}
