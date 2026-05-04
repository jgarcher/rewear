-- ===============================================
-- ReWear — manual item pairings + outfit feedback
-- Date: 2026-05-04
--
-- item_sets:        user-curated groups of items that go well together
-- item_set_items:   junction table
-- outfit_feedback:  thumbs up / down + optional comment on AI outfits
--
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
-- ===============================================

-- ============= Item sets (user-curated pairings) =============

create table item_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

alter table item_sets enable row level security;

create policy "users manage own sets" on item_sets
  for all using (auth.uid() = user_id);

create index item_sets_user_id_idx on item_sets(user_id);

create table item_set_items (
  set_id uuid not null references item_sets(id) on delete cascade,
  item_id uuid not null references wardrobe_items(id) on delete cascade,
  primary key (set_id, item_id)
);

alter table item_set_items enable row level security;

-- Visibility: a set's items are visible if you own the set
create policy "users see own set items" on item_set_items
  for all using (
    set_id in (select id from item_sets where user_id = auth.uid())
  );

create index item_set_items_item_id_idx on item_set_items(item_id);

-- ============= Outfit feedback (thumbs) =============

create type outfit_rating as enum ('up', 'down');

create table outfit_feedback (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references outfits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating outfit_rating not null,
  comment text,
  created_at timestamptz not null default now(),
  -- One rating per outfit per user; updates replace via on conflict.
  unique (outfit_id, user_id)
);

alter table outfit_feedback enable row level security;

create policy "users manage own outfit feedback" on outfit_feedback
  for all using (auth.uid() = user_id);

create index outfit_feedback_user_id_idx on outfit_feedback(user_id, created_at desc);
create index outfit_feedback_outfit_id_idx on outfit_feedback(outfit_id);
