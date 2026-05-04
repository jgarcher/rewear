import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CancelRequestButton,
  IncomingRequestActions,
  MarkReturnedButton,
} from "@/components/BorrowRequestActions";
import type { WardrobeItem } from "@/lib/types";

export const metadata = { title: "Friends — ReWear" };

type FriendProfile = { user_id: string; display_name: string | null };

type ItemWithOwner = WardrobeItem & {
  ownerName: string;
};

type IncomingRequest = {
  id: string;
  message: string | null;
  requested_for_date: string | null;
  return_by: string | null;
  created_at: string;
  item: WardrobeItem | null;
  requesterName: string;
};

type OutgoingRequest = {
  id: string;
  message: string | null;
  created_at: string;
  item: WardrobeItem | null;
  ownerName: string;
};

type ApprovedLoan = {
  id: string;
  return_by: string | null;
  item: WardrobeItem | null;
  counterpartyName: string;
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. My friends
  const { data: connections } = await supabase
    .from("connections")
    .select("friend_id")
    .eq("user_id", user.id);
  const friendIds = (connections ?? []).map((c) => c.friend_id);

  // 2. Friend profiles (display names)
  const friendProfiles = new Map<string, FriendProfile>();
  if (friendIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", friendIds);
    for (const p of profiles ?? []) {
      friendProfiles.set(p.user_id, p as FriendProfile);
    }
  }
  const nameOf = (id: string) =>
    friendProfiles.get(id)?.display_name ?? "Friend";

  // 3. Friends' shareable items (visible via RLS policy)
  let friendsItems: ItemWithOwner[] = [];
  if (friendIds.length > 0) {
    const { data: items } = await supabase
      .from("wardrobe_items")
      .select("*")
      .in("user_id", friendIds)
      .in("share_state", ["borrowable", "up_for_grabs"])
      .is("lent_to_user_id", null)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    friendsItems = (items ?? []).map((i) => ({
      ...(i as WardrobeItem),
      ownerName: nameOf((i as WardrobeItem).user_id),
    }));
  }

  // 4. Pending incoming borrow requests (others want my items)
  const { data: incomingRaw } = await supabase
    .from("borrow_requests")
    .select(
      "id, message, requested_for_date, return_by, created_at, item_id, requester_id"
    )
    .eq("owner_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // 5. Pending outgoing borrow requests
  const { data: outgoingRaw } = await supabase
    .from("borrow_requests")
    .select("id, message, created_at, item_id, owner_id")
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // 6. Approved loans I'm currently lending
  const { data: lendingRaw } = await supabase
    .from("borrow_requests")
    .select("id, return_by, item_id, requester_id")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .order("decided_at", { ascending: false });

  // 7. Approved loans I'm currently borrowing
  const { data: borrowingRaw } = await supabase
    .from("borrow_requests")
    .select("id, return_by, item_id, owner_id")
    .eq("requester_id", user.id)
    .eq("status", "approved")
    .order("decided_at", { ascending: false });

  // Resolve item details for all the request rows in one query
  const allItemIds = new Set<string>();
  for (const r of incomingRaw ?? []) allItemIds.add(r.item_id);
  for (const r of outgoingRaw ?? []) allItemIds.add(r.item_id);
  for (const r of lendingRaw ?? []) allItemIds.add(r.item_id);
  for (const r of borrowingRaw ?? []) allItemIds.add(r.item_id);

  const itemsById = new Map<string, WardrobeItem>();
  if (allItemIds.size > 0) {
    const { data: itemRows } = await supabase
      .from("wardrobe_items")
      .select("*")
      .in("id", Array.from(allItemIds));
    for (const it of itemRows ?? []) {
      itemsById.set(it.id, it as WardrobeItem);
    }
  }

  // Resolve any non-friend profiles referenced by requests (e.g. ex-friends)
  const allUserIds = new Set<string>();
  for (const r of incomingRaw ?? []) allUserIds.add(r.requester_id);
  for (const r of outgoingRaw ?? []) allUserIds.add(r.owner_id);
  for (const r of lendingRaw ?? []) allUserIds.add(r.requester_id);
  for (const r of borrowingRaw ?? []) allUserIds.add(r.owner_id);
  const missingNames = Array.from(allUserIds).filter(
    (id) => !friendProfiles.has(id)
  );
  if (missingNames.length > 0) {
    const { data: extra } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", missingNames);
    for (const p of extra ?? []) {
      friendProfiles.set(p.user_id, p as FriendProfile);
    }
  }

  const incoming: IncomingRequest[] = (incomingRaw ?? []).map((r) => ({
    id: r.id,
    message: r.message,
    requested_for_date: r.requested_for_date,
    return_by: r.return_by,
    created_at: r.created_at,
    item: itemsById.get(r.item_id) ?? null,
    requesterName: nameOf(r.requester_id),
  }));

  const outgoing: OutgoingRequest[] = (outgoingRaw ?? []).map((r) => ({
    id: r.id,
    message: r.message,
    created_at: r.created_at,
    item: itemsById.get(r.item_id) ?? null,
    ownerName: nameOf(r.owner_id),
  }));

  const lending: ApprovedLoan[] = (lendingRaw ?? []).map((r) => ({
    id: r.id,
    return_by: r.return_by,
    item: itemsById.get(r.item_id) ?? null,
    counterpartyName: nameOf(r.requester_id),
  }));

  const borrowing: ApprovedLoan[] = (borrowingRaw ?? []).map((r) => ({
    id: r.id,
    return_by: r.return_by,
    item: itemsById.get(r.item_id) ?? null,
    counterpartyName: nameOf(r.owner_id),
  }));

  // Group friends' items by owner for display
  const groupedByFriend = new Map<string, ItemWithOwner[]>();
  for (const it of friendsItems) {
    const arr = groupedByFriend.get(it.user_id) ?? [];
    arr.push(it);
    groupedByFriend.set(it.user_id, arr);
  }

  const totalActions = incoming.length + outgoing.length + lending.length;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Friends
            </p>
            <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
              {friendIds.length === 0
                ? "Build your circle."
                : `${friendIds.length} ${
                    friendIds.length === 1 ? "friend" : "friends"
                  }.`}
            </h1>
            {friendIds.length > 0 && (
              <p className="mt-2 text-sm text-charcoal-soft">
                {totalActions === 0
                  ? "All quiet. Nothing pending."
                  : `${totalActions} ${
                      totalActions === 1 ? "thing" : "things"
                    } to look at.`}
              </p>
            )}
          </div>
          <Link
            href="/friends/invite"
            className="rounded-full bg-forest-500 px-5 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
          >
            + Invite
          </Link>
        </div>

        {/* Empty state */}
        {friendIds.length === 0 && (
          <section className="mt-10 rounded-3xl border border-linen-200 bg-linen-50 p-8 sm:p-10">
            <p className="font-heading text-2xl font-medium text-charcoal sm:text-3xl">
              No friends yet.
            </p>
            <p className="mt-3 text-base text-charcoal-soft">
              Send a link to a friend, sister, or housemate. When they accept,
              their borrowable closet shows up here.
            </p>
            <Link
              href="/friends/invite"
              className="mt-6 inline-block rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600"
            >
              Get an invite link
            </Link>
          </section>
        )}

        {/* Inbox: incoming requests */}
        {incoming.length > 0 && (
          <Section label={`${incoming.length} asking to borrow`}>
            <div className="space-y-3">
              {incoming.map((r) => (
                <RequestCard
                  key={r.id}
                  item={r.item}
                  primary={`${r.requesterName} wants to borrow`}
                  secondary={
                    r.requested_for_date
                      ? `For ${formatDate(r.requested_for_date)}`
                      : `Sent ${relTime(r.created_at)}`
                  }
                  message={r.message}
                  action={<IncomingRequestActions requestId={r.id} />}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Lending out (approved, not yet returned) */}
        {lending.length > 0 && (
          <Section label="Currently lent out">
            <div className="space-y-3">
              {lending.map((r) => (
                <RequestCard
                  key={r.id}
                  item={r.item}
                  primary={`Lent to ${r.counterpartyName}`}
                  secondary={
                    r.return_by ? `Back by ${formatDate(r.return_by)}` : null
                  }
                  action={<MarkReturnedButton requestId={r.id} />}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Borrowing (approved, in your hands) */}
        {borrowing.length > 0 && (
          <Section label="In your hands">
            <div className="space-y-3">
              {borrowing.map((r) => (
                <RequestCard
                  key={r.id}
                  item={r.item}
                  primary={`Borrowed from ${r.counterpartyName}`}
                  secondary={
                    r.return_by ? `Back by ${formatDate(r.return_by)}` : null
                  }
                />
              ))}
            </div>
          </Section>
        )}

        {/* Outgoing pending */}
        {outgoing.length > 0 && (
          <Section label="Waiting on a friend">
            <div className="space-y-3">
              {outgoing.map((r) => (
                <RequestCard
                  key={r.id}
                  item={r.item}
                  primary={`Asked ${r.ownerName}`}
                  secondary={`Sent ${relTime(r.created_at)}`}
                  message={r.message}
                  action={<CancelRequestButton requestId={r.id} />}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Friends' shareable items */}
        {friendIds.length > 0 && (
          <Section
            label={
              friendsItems.length === 0
                ? "Your friends haven't shared anything yet"
                : "Browse friends' closets"
            }
          >
            {friendsItems.length === 0 ? (
              <div className="rounded-2xl border border-linen-200 bg-linen-50 p-6">
                <p className="text-sm text-charcoal-soft">
                  When a friend marks something borrowable or up for grabs,
                  it&apos;ll show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(groupedByFriend.entries()).map(
                  ([friendId, fitems]) => (
                    <div key={friendId}>
                      <div className="mb-3 flex items-baseline justify-between">
                        <h3 className="font-heading text-lg font-medium text-charcoal">
                          {nameOf(friendId)}
                        </h3>
                        <p className="text-xs text-charcoal-muted">
                          {fitems.length}{" "}
                          {fitems.length === 1 ? "piece" : "pieces"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {fitems.map((it) => (
                          <Link
                            key={it.id}
                            href={`/wardrobe/${it.id}`}
                            className="group block overflow-hidden rounded-2xl border border-linen-200 bg-linen-50 transition-colors hover:border-forest-500"
                          >
                            <div className="relative aspect-square w-full bg-linen-200">
                              {it.photo_url ? (
                                <Image
                                  src={it.photo_url}
                                  alt={it.name}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 25vw"
                                  className="object-cover"
                                />
                              ) : null}
                              {it.share_state === "up_for_grabs" && (
                                <span className="absolute right-2 top-2 rounded-full bg-clay-500/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-linen-100">
                                  Up for grabs
                                </span>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="truncate text-sm font-medium text-charcoal">
                                {it.name}
                              </p>
                              <p className="mt-0.5 text-xs text-charcoal-muted">
                                {it.share_state === "up_for_grabs"
                                  ? "Free to claim"
                                  : "Ask to borrow"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </Section>
        )}

        {/* Friend list at bottom */}
        {friendIds.length > 0 && (
          <Section label="Your circle">
            <div className="flex flex-wrap gap-3">
              {friendIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-full border border-linen-200 bg-linen-50 px-4 py-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500/10 text-xs font-medium text-forest-700">
                    {(nameOf(id)[0] ?? "?").toUpperCase()}
                  </span>
                  <span className="text-sm text-charcoal">{nameOf(id)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
        {label}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RequestCard({
  item,
  primary,
  secondary,
  message,
  action,
}: {
  item: WardrobeItem | null;
  primary: string;
  secondary: string | null;
  message?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-linen-200 bg-linen-50 p-3">
      <Link
        href={item ? `/wardrobe/${item.id}` : "#"}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-linen-200"
      >
        {item?.photo_url ? (
          <Image
            src={item.photo_url}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-charcoal">
          {item?.name ?? "Item"}
        </p>
        <p className="text-xs text-charcoal-soft">{primary}</p>
        {secondary && (
          <p className="text-xs text-charcoal-muted">{secondary}</p>
        )}
        {message && (
          <p className="mt-1 truncate text-xs italic text-charcoal-soft">
            &ldquo;{message}&rdquo;
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
