-- ===============================================
-- ReWear — web push subscriptions
-- Date: 2026-05-04
--
-- One row per device a user has registered for push notifications.
-- Re-subscribing on the same device upserts (unique on endpoint).
--
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
-- ===============================================

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "users manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

create index push_subscriptions_user_id_idx on push_subscriptions(user_id);
