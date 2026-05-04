import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export const metadata = { title: "Edit profile — ReWear" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/profile"
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← Profile
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
          Edit profile
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
          Your face, your name.
        </h1>
        <p className="mt-2 text-base text-charcoal-soft">
          What your friends see when they connect with you.
        </p>

        <div className="mt-10">
          <ProfileEditForm
            initialName={
              profile?.display_name ?? user.email?.split("@")[0] ?? ""
            }
            initialAvatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </div>
    </main>
  );
}
