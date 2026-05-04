import Link from "next/link";
import { AddItemFlow } from "@/components/AddItemFlow";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Add to wardrobe — ReWear" };

type SearchParams = Promise<{ magic?: string }>;

export default async function AddItemPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { magic } = await searchParams;
  const isMagicOnboarding = magic === "needs-items";

  let itemCount = 0;
  if (isMagicOnboarding) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from("wardrobe_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");
      itemCount = count ?? 0;
    }
  }

  const remaining = Math.max(0, 10 - itemCount);

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/wardrobe"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Wardrobe
        </Link>

        {isMagicOnboarding && (
          <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-forest-500 to-forest-700 p-6 text-linen-100 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-linen-100/70">
              Unlock the magic
            </p>
            <h2 className="mt-2 font-heading text-2xl font-medium sm:text-3xl">
              {remaining > 0
                ? `Add ${remaining} more ${
                    remaining === 1 ? "piece" : "pieces"
                  } and the magic kicks in.`
                : "You&apos;re ready — tap the logo to try it."}
            </h2>
            <p className="mt-2 text-sm text-linen-100/85 sm:text-base">
              The logo top-right is a magic button. Tap it on any page and
              we&apos;ll surprise you with an outfit pulled from your wardrobe.
              The more pieces you photograph, the better the magic gets.
            </p>
            <p className="mt-3 text-xs text-linen-100/70">
              You have {itemCount} {itemCount === 1 ? "piece" : "pieces"}.
              Aim for 10 to start, then keep adding.
            </p>
          </div>
        )}

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Add to wardrobe
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          One photo. We&apos;ll do the rest.
        </h1>
        <p className="mt-3 text-base text-charcoal-soft">
          Snap or upload a photo. We&apos;ll guess the basics — you confirm or
          edit.
        </p>

        <div className="mt-10">
          <AddItemFlow />
        </div>
      </div>
    </main>
  );
}
