import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Step = {
  step: number;
  title: string;
  description: string;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("upcycle_tutorials")
    .select("title")
    .eq("id", id)
    .single();
  return {
    title: data?.title ? `${data.title} — ReWear` : "Tutorial — ReWear",
  };
}

export default async function TutorialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tutorial, error } = await supabase
    .from("upcycle_tutorials")
    .select(
      "id, title, difficulty, time_required, materials_needed, steps, applicable_categories"
    )
    .eq("id", id)
    .single();

  if (error || !tutorial) notFound();

  const steps = (tutorial.steps as Step[]) || [];
  const difficulty = tutorial.difficulty as keyof typeof DIFFICULTY_LABELS;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/discover/upcycle"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← All tutorials
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
          Upcycle
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
          {tutorial.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${DIFFICULTY_COLOURS[difficulty]}`}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
          {tutorial.time_required && (
            <span className="text-charcoal-muted">{tutorial.time_required}</span>
          )}
          {tutorial.applicable_categories?.length > 0 && (
            <span className="text-charcoal-muted">
              For{" "}
              {tutorial.applicable_categories
                .map((c: string) =>
                  c === "tshirt"
                    ? "t-shirts"
                    : c === "coat"
                    ? "coats"
                    : c + "s"
                )
                .join(", ")}
            </span>
          )}
        </div>

        {/* Materials */}
        {tutorial.materials_needed?.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-xl font-medium text-charcoal">
              You'll need
            </h2>
            <ul className="mt-4 space-y-2 text-base text-charcoal-soft">
              {tutorial.materials_needed.map((m: string) => (
                <li key={m} className="flex gap-3">
                  <span className="text-clay-500">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-medium text-charcoal">
              Steps
            </h2>
            <ol className="mt-6 space-y-6">
              {steps.map((s) => (
                <li
                  key={s.step}
                  className="rounded-2xl border border-linen-200 bg-linen-50 p-6"
                >
                  <p className="font-heading text-2xl font-medium text-clay-500">
                    {String(s.step).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-heading text-lg font-medium text-charcoal">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-charcoal-soft">
                    {s.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-16 rounded-2xl border border-linen-200 bg-linen-50 px-6 py-5 text-center">
          <p className="text-sm text-charcoal-soft">
            Made one? We'd love to see it. The Upcycling Coach lands in a future
            update — for now, the tutorials are paired by item type.
          </p>
        </div>
      </div>
    </main>
  );
}
