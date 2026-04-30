import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Upcycle — ReWear" };

type Tutorial = {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  time_required: string | null;
  applicable_categories: string[];
  image_url: string | null;
};

const DIFFICULTY_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_COLOURS = {
  beginner: "bg-sage-100 text-sage-600",
  intermediate: "bg-clay-100 text-clay-600",
  advanced: "bg-forest-100 text-forest-700",
};

export default async function UpcyclePage() {
  const supabase = await createClient();
  const { data: tutorials } = await supabase
    .from("upcycle_tutorials")
    .select("id, title, difficulty, time_required, applicable_categories, image_url")
    .order("difficulty");

  const list = (tutorials ?? []) as Tutorial[];

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/discover"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Discover
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
          Upcycle
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Make something new.
        </h1>
        <p className="mt-3 text-base text-charcoal-soft sm:text-lg">
          From tired pieces in your wardrobe. Each tutorial is paired with the
          item types it works for.
        </p>

        {list.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-linen-200 bg-linen-50 p-10 text-center">
            <p className="text-base text-charcoal-soft">
              Tutorials are being added. Back soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {list.map((t) => (
              <Link
                key={t.id}
                href={`/discover/upcycle/${t.id}`}
                className="group block rounded-2xl border border-linen-200 bg-linen-50 p-6 transition-colors hover:border-clay-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-xl font-medium text-charcoal">
                    {t.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wider ${DIFFICULTY_COLOURS[t.difficulty]}`}
                  >
                    {DIFFICULTY_LABELS[t.difficulty]}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-charcoal-muted">
                  {t.time_required && <span>{t.time_required}</span>}
                  {t.applicable_categories.length > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        For{" "}
                        {t.applicable_categories
                          .map((c) =>
                            c === "tshirt"
                              ? "t-shirts"
                              : c === "coat"
                              ? "coats"
                              : c + "s"
                          )
                          .join(", ")}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
