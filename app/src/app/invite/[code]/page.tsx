import Link from "next/link";
import { lookupInvite } from "@/app/friends/actions";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteButton } from "@/components/AcceptInviteButton";
import { Logo } from "@/components/Logo";

export const metadata = { title: "You've been invited — ReWear" };

type Params = Promise<{ code: string }>;

export default async function InviteLandingPage({
  params,
}: {
  params: Params;
}) {
  const { code } = await params;
  const lookup = await lookupInvite(code);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = !!user;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-10 flex flex-col items-center">
          <Logo size={72} showWordmark={false} />
        </div>

        {!lookup.valid ? (
          <>
            <h1 className="font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
              Invite unavailable.
            </h1>
            <p className="mt-3 text-base text-charcoal-soft">
              {lookup.reason === "used"
                ? "This invite has already been used."
                : lookup.reason === "expired"
                ? "This invite has expired."
                : "We couldn't find this invite."}{" "}
              Ask your friend to share a fresh link.
            </p>
            <Link
              href={signedIn ? "/" : "/signin"}
              className="mt-8 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              {signedIn ? "Back to ReWear" : "Sign in"}
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              You&apos;re invited
            </p>
            <h1 className="mt-4 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
              {lookup.inviter_name} wants to share their closet.
            </h1>
            <p className="mt-4 text-base text-charcoal-soft">
              ReWear lets you borrow, lend and gift clothes between friends.
              Connect with {lookup.inviter_name} and you&apos;ll see what
              they&apos;ve marked borrowable — and they&apos;ll see yours.
            </p>

            <div className="mt-10 flex justify-center">
              {signedIn ? (
                <AcceptInviteButton code={code} />
              ) : (
                <Link
                  href={`/signin?next=/invite/${encodeURIComponent(code)}`}
                  className="rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
                >
                  Sign in to accept
                </Link>
              )}
            </div>

            <p className="mt-6 text-xs text-charcoal-muted">
              No money. No marketplace. Just friends.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
