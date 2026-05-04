import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InviteShareCard } from "@/components/InviteShareCard";

export const metadata = { title: "Invite a friend — ReWear" };

export default async function InvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Most recent unused, unexpired invite (if any)
  const { data: invites } = await supabase
    .from("connection_invites")
    .select("code, expires_at, used_at")
    .eq("inviter_id", user.id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  const initialCode = invites?.[0]?.code ?? null;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/friends"
          className="text-xs uppercase tracking-[0.2em] text-charcoal-muted transition-colors hover:text-forest-700"
        >
          ← Friends
        </Link>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Invite a friend.
        </h1>
        <p className="mt-2 text-base text-charcoal-soft">
          The whole point: your closet plus theirs.
        </p>

        <div className="mt-8">
          <InviteShareCard initialCode={initialCode} />
        </div>

        <div className="mt-10 space-y-4 text-sm text-charcoal-soft">
          <p>
            <span className="font-medium text-charcoal">How it works.</span>{" "}
            Share the link. They sign in (or sign up). When they accept,
            you&apos;re both connected and can see each other&apos;s borrowable
            items.
          </p>
          <p>
            <span className="font-medium text-charcoal">No money.</span>{" "}
            ReWear isn&apos;t a marketplace. It&apos;s a way to lend, borrow
            and gift between people you actually know.
          </p>
        </div>
      </div>
    </main>
  );
}
