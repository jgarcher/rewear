import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteItemButton } from "@/components/DeleteItemButton";
import { ShareStatePicker } from "@/components/ShareStatePicker";
import { BorrowRequestButton } from "@/components/BorrowRequestButton";
import { AddToScheduleButton } from "@/components/AddToScheduleButton";
import { PairingsSection } from "@/components/PairingsSection";
import {
  IncomingRequestActions,
  MarkReceivedButton,
  MarkReturnedButton,
} from "@/components/BorrowRequestActions";
import { CATEGORY_LABELS, type ShareState, type WardrobeItem } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("wardrobe_items")
    .select("name")
    .eq("id", id)
    .single();
  return { title: data?.name ? `${data.name} — ReWear` : "Item — ReWear" };
}

function formatRelativeDate(date: string | null): string {
  if (!date) return "never";
  const days = Math.round(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: item, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) notFound();

  const isOwner = item.user_id === user.id;
  const isLentToMe = item.lent_to_user_id === user.id;
  const isLent = !!item.lent_to_user_id;

  // Wear stats — owner sees their item; friends see only when borrowing it
  const { data: wears } = isOwner
    ? await supabase
        .from("wear_log")
        .select("worn_date")
        .eq("item_id", id)
        .order("worn_date", { ascending: false })
    : { data: [] };

  // Pairings (owner only): fetch the user's existing pairings for this item +
  // the candidate pool (other active items they could pair with).
  let partners: Array<{
    setId: string;
    setName: string | null;
    item: WardrobeItem;
  }> = [];
  let pairingCandidates: WardrobeItem[] = [];
  if (isOwner) {
    // Sets that include this item
    const { data: myLinks } = await supabase
      .from("item_set_items")
      .select("set_id")
      .eq("item_id", id);
    const setIds = (myLinks ?? []).map((l) => l.set_id);

    // Set names
    const setMeta = new Map<string, string | null>();
    if (setIds.length > 0) {
      const { data: sets } = await supabase
        .from("item_sets")
        .select("id, name")
        .in("id", setIds);
      for (const s of sets ?? []) setMeta.set(s.id, s.name ?? null);
    }

    // Partner item links (other items in those sets)
    const partnerSetEntries: Array<{ set_id: string; item_id: string }> = [];
    if (setIds.length > 0) {
      const { data: links } = await supabase
        .from("item_set_items")
        .select("set_id, item_id")
        .in("set_id", setIds)
        .neq("item_id", id);
      partnerSetEntries.push(...(links ?? []));
    }

    // Hydrate the partner items
    const partnerItemIds = Array.from(
      new Set(partnerSetEntries.map((e) => e.item_id))
    );
    const partnerById = new Map<string, WardrobeItem>();
    if (partnerItemIds.length > 0) {
      const { data: pi } = await supabase
        .from("wardrobe_items")
        .select("*")
        .in("id", partnerItemIds);
      for (const it of (pi ?? []) as WardrobeItem[]) {
        partnerById.set(it.id, it);
      }
    }
    partners = partnerSetEntries
      .map((e) => {
        const it = partnerById.get(e.item_id);
        if (!it) return null;
        return {
          setId: e.set_id,
          setName: setMeta.get(e.set_id) ?? null,
          item: it,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Candidate pool — other active items in the user's wardrobe, excluding
    // this one and any items already paired with it.
    const alreadyPairedIds = new Set(partnerItemIds);
    alreadyPairedIds.add(id);
    const { data: candRaw } = await supabase
      .from("wardrobe_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    pairingCandidates = ((candRaw ?? []) as WardrobeItem[]).filter(
      (it) => !alreadyPairedIds.has(it.id)
    );
  }
  const wearCount = wears?.length ?? 0;
  const lastWornDate = wears && wears.length > 0 ? wears[0].worn_date : null;

  // Owner: pending requests on this item + counterparty names
  let pendingRequests: Array<{
    id: string;
    requester_id: string;
    requester_name: string;
    message: string | null;
    requested_for_date: string | null;
    return_by: string | null;
  }> = [];
  let activeLoanId: string | null = null;
  let activeLoanStatus: "approved" | "received" | null = null;
  if (isOwner) {
    const { data: prs } = await supabase
      .from("borrow_requests")
      .select(
        "id, requester_id, message, requested_for_date, return_by, status, received_at"
      )
      .eq("item_id", id)
      .in("status", ["pending", "approved", "received"]);

    const requesterIds = (prs ?? []).map((p) => p.requester_id);
    const nameMap = new Map<string, string>();
    if (requesterIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", requesterIds);
      for (const p of profs ?? []) {
        nameMap.set(p.user_id, p.display_name ?? "Friend");
      }
    }
    pendingRequests = (prs ?? [])
      .filter((p) => p.status === "pending")
      .map((p) => ({
        id: p.id,
        requester_id: p.requester_id,
        requester_name: nameMap.get(p.requester_id) ?? "Friend",
        message: p.message,
        requested_for_date: p.requested_for_date,
        return_by: p.return_by,
      }));
    const active = (prs ?? []).find((p) =>
      ["approved", "received"].includes(p.status)
    );
    activeLoanId = active?.id ?? null;
    activeLoanStatus = (active?.status as "approved" | "received") ?? null;
  }

  // Borrower: active loan request id (so they can mark received)
  let myLoanId: string | null = null;
  let myLoanStatus: "approved" | "received" | null = null;
  if (!isOwner && isLentToMe) {
    const { data: loan } = await supabase
      .from("borrow_requests")
      .select("id, status")
      .eq("item_id", id)
      .eq("requester_id", user.id)
      .in("status", ["approved", "received"])
      .maybeSingle();
    if (loan) {
      myLoanId = loan.id;
      myLoanStatus = loan.status as "approved" | "received";
    }
  }

  // Owner display name (for non-owner viewers)
  let ownerName = "Friend";
  if (!isOwner) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", item.user_id)
      .single();
    ownerName = ownerProfile?.display_name ?? "Friend";
  }

  // Lent-to display name (for owner viewing lent-out item)
  let lentToName: string | null = null;
  if (isOwner && item.lent_to_user_id) {
    const { data: lp } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", item.lent_to_user_id)
      .single();
    lentToName = lp?.display_name ?? "a friend";
  }

  // Non-owner: do I already have a pending request?
  let viewerHasPending = false;
  if (!isOwner) {
    const { data: mine } = await supabase
      .from("borrow_requests")
      .select("id")
      .eq("item_id", id)
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    viewerHasPending = !!mine;
  }

  const shareState = item.share_state as ShareState;

  return (
    <main className="flex-1 px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href={isOwner ? "/wardrobe" : "/friends"}
          className="text-sm text-charcoal-soft hover:text-forest-700"
        >
          ← {isOwner ? "Wardrobe" : "Friends"}
        </Link>

        {/* Photo */}
        <div className="relative mt-6 aspect-square w-full overflow-hidden rounded-3xl bg-linen-200">
          {item.photo_url ? (
            <Image
              src={item.photo_url}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-charcoal-placeholder">
              No photo
            </div>
          )}
          {!isOwner && shareState === "up_for_grabs" && (
            <span className="absolute right-3 top-3 rounded-full bg-clay-500/95 px-3 py-1 text-xs font-medium uppercase tracking-wider text-linen-100">
              Up for grabs
            </span>
          )}
        </div>

        {/* Title block */}
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-forest-500">
            {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
            {item.subcategory ? ` · ${item.subcategory}` : ""}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
            {item.name}
          </h1>
          {!isOwner && (
            <p className="mt-2 text-base text-charcoal-soft">
              From {ownerName}
              {item.brand ? ` · ${item.brand}` : ""}
            </p>
          )}
          {isOwner && item.brand && (
            <p className="mt-2 text-base text-charcoal-soft">{item.brand}</p>
          )}
        </div>

        {/* Owner: lent-out banner */}
        {isOwner && isLent && (
          <div className="mt-6 rounded-2xl border border-clay-100 bg-clay-100/40 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
              {activeLoanStatus === "received"
                ? "In their hands"
                : "Awaiting handover"}
            </p>
            <p className="mt-2 text-base text-charcoal">
              {activeLoanStatus === "received"
                ? `${lentToName} has it`
                : `Lent to ${lentToName}`}
              {item.return_by ? ` · back by ${formatDate(item.return_by)}` : ""}
            </p>
            {activeLoanId && (
              <div className="mt-3">
                <MarkReturnedButton requestId={activeLoanId} />
              </div>
            )}
          </div>
        )}

        {/* Borrower: you have it */}
        {!isOwner && isLentToMe && (
          <div className="mt-6 rounded-2xl border border-forest-100 bg-forest-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-700">
              {myLoanStatus === "received" ? "In your hands" : "Approved — pick it up"}
            </p>
            <p className="mt-2 text-base text-charcoal">
              {myLoanStatus === "received"
                ? `Borrowed from ${ownerName}`
                : `${ownerName} approved the loan`}
              {item.return_by ? ` · back by ${formatDate(item.return_by)}` : ""}
            </p>
            {myLoanStatus === "approved" && myLoanId && (
              <div className="mt-3">
                <MarkReceivedButton requestId={myLoanId} />
              </div>
            )}
          </div>
        )}

        {/* Stats row — only for owner (or borrower with limited stats) */}
        {isOwner && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Worn", value: wearCount.toString() },
              { label: "Last worn", value: formatRelativeDate(lastWornDate) },
              { label: "Colour", value: item.primary_colour },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-center"
              >
                <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                  {s.label}
                </p>
                <p className="mt-1 truncate font-heading text-base font-medium text-charcoal">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Owner: share state picker */}
        {isOwner && (
          <div className="mt-8">
            <ShareStatePicker
              itemId={item.id}
              current={shareState}
              isLent={isLent}
            />
          </div>
        )}

        {/* Owner: manual pairings */}
        {isOwner && (
          <div className="mt-6">
            <PairingsSection
              itemId={item.id}
              itemName={item.name as string}
              partners={partners}
              candidates={pairingCandidates}
            />
          </div>
        )}

        {/* Owner: pending requests inbox for this item */}
        {isOwner && pendingRequests.length > 0 && !isLent && (
          <div className="mt-6 rounded-2xl border border-linen-200 bg-linen-50 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest-500">
              Asking to borrow
            </p>
            <div className="mt-3 space-y-3">
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl border border-linen-200 bg-linen-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal">
                      {r.requester_name}
                    </p>
                    {r.requested_for_date && (
                      <p className="text-xs text-charcoal-muted">
                        For {formatDate(r.requested_for_date)}
                        {r.return_by ? ` · back by ${formatDate(r.return_by)}` : ""}
                      </p>
                    )}
                    {r.message && (
                      <p className="mt-1 truncate text-xs italic text-charcoal-soft">
                        &ldquo;{r.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <IncomingRequestActions requestId={r.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-owner: borrow controls */}
        {!isOwner && !isLentToMe && (
          <div className="mt-8">
            {isLent ? (
              <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-sm text-charcoal-soft">
                Currently with someone else.
              </div>
            ) : viewerHasPending ? (
              <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-sm text-charcoal-soft">
                Request sent. Waiting on {ownerName}.
              </div>
            ) : shareState === "private" ? (
              <div className="rounded-2xl border border-linen-200 bg-linen-50 p-4 text-sm text-charcoal-soft">
                Not currently shared.
              </div>
            ) : (
              <BorrowRequestButton itemId={item.id} ownerName={ownerName} />
            )}
          </div>
        )}

        {/* Action buttons — owner only */}
        {isOwner && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Link
              href={`/wardrobe/${item.id}/edit`}
              className="rounded-full border border-charcoal/15 px-6 py-3 text-center text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
            >
              Edit details
            </Link>
            <AddToScheduleButton itemId={item.id} />
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Notes
            </p>
            <p className="mt-2 text-base leading-relaxed text-charcoal-soft">
              {item.notes}
            </p>
          </div>
        )}

        {/* Metadata grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-linen-200 bg-linen-50 p-6 text-sm">
          {item.material && (
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Material
              </p>
              <p className="mt-1 text-charcoal">{item.material}</p>
            </div>
          )}
          {isOwner && item.acquired_source && (
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Source
              </p>
              <p className="mt-1 text-charcoal">{item.acquired_source}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-charcoal-muted">
              Condition
            </p>
            <p className="mt-1 text-charcoal">{item.condition}</p>
          </div>
          {isOwner && item.estimated_price !== null && (
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal-muted">
                Estimated value
              </p>
              <p className="mt-1 text-charcoal">£{item.estimated_price}</p>
            </div>
          )}
        </div>

        {/* Delete — owner only */}
        {isOwner && (
          <div className="mt-12 text-center">
            <DeleteItemButton itemId={item.id} itemName={item.name} />
          </div>
        )}
      </div>
    </main>
  );
}
