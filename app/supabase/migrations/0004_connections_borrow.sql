-- ===============================================
-- ReWear — connections, invites, borrow requests
-- Source: ADR (TBD) — friend-graph + lending model
-- Date:   2026-05-04
--
-- Run this in the Supabase SQL Editor:
--   1. Open https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
--   2. Paste the entire contents of this file
--   3. Click "Run"
-- ===============================================

-- ============= Enums =============

create type share_state as enum (
  'private', 'borrowable', 'up_for_grabs'
);

create type borrow_status as enum (
  'pending', 'approved', 'declined', 'returned', 'cancelled'
);

-- ============= Wardrobe item additions =============

alter table wardrobe_items
  add column share_state share_state not null default 'private',
  add column lent_to_user_id uuid references auth.users(id) on delete set null,
  add column return_by date;

create index wardrobe_items_share_state_idx
  on wardrobe_items(share_state) where share_state <> 'private';

-- ============= Connections (mirrored rows for symmetric friendship) =============
--
-- One accepted friendship = two rows: (A, B) and (B, A). Lets RLS stay dead
-- simple (user_id = auth.uid()) and "list my friends" is a single index scan.

create table connections (
  user_id   uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table connections enable row level security;

create policy "users see own connections"   on connections
  for select using (auth.uid() = user_id);
create policy "users delete own connections" on connections
  for delete using (auth.uid() = user_id);
-- Inserts happen via accept_invite() RPC (SECURITY DEFINER), so no INSERT policy.

create index connections_friend_id_idx on connections(friend_id);

-- ============= Connection invites =============

create table connection_invites (
  code text primary key,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  used_by_user_id uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

alter table connection_invites enable row level security;

-- Inviter manages their own invites
create policy "inviter sees own invites" on connection_invites
  for select using (auth.uid() = inviter_id);
create policy "inviter creates invites" on connection_invites
  for insert with check (auth.uid() = inviter_id);
create policy "inviter revokes own invites" on connection_invites
  for delete using (auth.uid() = inviter_id);
-- Accepters interact via the accept_invite() RPC.

create index connection_invites_inviter_idx on connection_invites(inviter_id);

-- ============= Borrow requests =============

create table borrow_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references wardrobe_items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  status borrow_status not null default 'pending',
  message text,
  requested_for_date date,
  return_by date,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  returned_at timestamptz,
  check (owner_id <> requester_id)
);

alter table borrow_requests enable row level security;

create policy "owner or requester sees" on borrow_requests
  for select using (auth.uid() in (owner_id, requester_id));

create policy "requester creates" on borrow_requests
  for insert with check (auth.uid() = requester_id);

-- Owner can approve/decline; requester can cancel; either can mark returned.
create policy "parties update" on borrow_requests
  for update using (auth.uid() in (owner_id, requester_id));

create index borrow_requests_owner_idx on borrow_requests(owner_id, status);
create index borrow_requests_requester_idx on borrow_requests(requester_id, status);
create index borrow_requests_item_idx on borrow_requests(item_id);

-- ============= Friend visibility helper + extended item RLS =============

-- Returns true if auth.uid() is friends with target_id. Used in RLS policies.
create function is_friend(target_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from connections
    where user_id = auth.uid() and friend_id = target_id
  );
$$;

-- Add a friend-visibility SELECT policy on wardrobe_items.
-- Postgres ORs all SELECT policies, so this only broadens access.
create policy "friends see borrowable items" on wardrobe_items
  for select using (
    share_state in ('borrowable', 'up_for_grabs')
    and is_friend(user_id)
  );

-- Friends also need to read borrower's profile (display_name) for UI.
create policy "friends see profile basics" on profiles
  for select using (is_friend(user_id));

-- ============= RPC: accept_invite =============
--
-- Atomically validates invite, creates mirrored connection rows, marks invite used.
-- SECURITY DEFINER lets it bypass RLS for the inserts.

create function accept_invite(invite_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite connection_invites%rowtype;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_invite from connection_invites
   where code = invite_code for update;

  if not found then
    raise exception 'invite_not_found';
  end if;

  if v_invite.used_at is not null then
    raise exception 'invite_already_used';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  if v_invite.inviter_id = v_caller then
    raise exception 'cannot_self_accept';
  end if;

  -- Already friends? Idempotent: mark invite used, return existing.
  if exists (
    select 1 from connections
     where user_id = v_caller and friend_id = v_invite.inviter_id
  ) then
    update connection_invites
       set used_by_user_id = v_caller, used_at = now()
     where code = invite_code;
    return json_build_object('inviter_id', v_invite.inviter_id, 'already_friends', true);
  end if;

  -- Mirror rows
  insert into connections (user_id, friend_id) values
    (v_caller, v_invite.inviter_id),
    (v_invite.inviter_id, v_caller);

  update connection_invites
     set used_by_user_id = v_caller, used_at = now()
   where code = invite_code;

  return json_build_object('inviter_id', v_invite.inviter_id, 'already_friends', false);
end;
$$;

-- ============= RPC: lookup_invite (for landing page preview) =============

create function lookup_invite(invite_code text)
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_invite connection_invites%rowtype;
  v_inviter_name text;
begin
  select * into v_invite from connection_invites where code = invite_code;
  if not found then
    return json_build_object('valid', false, 'reason', 'not_found');
  end if;
  if v_invite.used_at is not null then
    return json_build_object('valid', false, 'reason', 'used');
  end if;
  if v_invite.expires_at < now() then
    return json_build_object('valid', false, 'reason', 'expired');
  end if;

  select display_name into v_inviter_name from profiles where user_id = v_invite.inviter_id;

  return json_build_object(
    'valid', true,
    'inviter_id', v_invite.inviter_id,
    'inviter_name', coalesce(v_inviter_name, 'A friend')
  );
end;
$$;

-- Allow anonymous + authenticated to call lookup_invite (so the landing page
-- can show "X invited you" even before signin).
-- ============= RPC: remove_friend =============
--
-- Deletes both mirrored rows in a single transaction. Caller can only remove
-- friendships they're part of.

create function remove_friend(other_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;
  delete from connections
   where (user_id = v_caller and friend_id = other_user_id)
      or (user_id = other_user_id and friend_id = v_caller);
end;
$$;

grant execute on function lookup_invite(text) to anon, authenticated;
grant execute on function accept_invite(text) to authenticated;
grant execute on function remove_friend(uuid) to authenticated;

-- ============= Done =============
