-- ===============================================
-- ReWear — initial schema
-- Source: ADR 012 (data model)
-- Date:   2026-04-29
--
-- Run this in the Supabase SQL Editor:
--   1. Open https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new
--   2. Paste the entire contents of this file
--   3. Click "Run"
-- ===============================================

-- ============= Custom enum types =============

create type item_category as enum (
  'top', 'tshirt', 'bottom', 'dress', 'coat', 'shoes', 'accessory'
);

create type acquired_source as enum (
  'new', 'sale', 'vinted', 'depop', 'charity-shop', 'gift', 'hand-me-down', 'swap', 'unknown'
);

create type item_condition as enum (
  'new', 'like-new', 'good', 'worn-in', 'needs-mending'
);

create type item_status as enum (
  'active', 'listed', 'donated', 'upcycled', 'retired'
);

create type outfit_source as enum (
  'user_logged', 'ai_generated', 'ai_accepted'
);

create type listing_status as enum (
  'active', 'pending', 'sold', 'withdrawn'
);

create type brand_submission_status as enum (
  'verified', 'pending', 'community-submitted'
);

create type tutorial_difficulty as enum (
  'beginner', 'intermediate', 'advanced'
);

create type fact_confidence as enum (
  'peer-reviewed', 'industry-report', 'general-knowledge'
);

-- ============= Profiles (extends auth.users) =============

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  streak_count int not null default 0,
  last_logged_date date,
  lifetime_rewears int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users see own profile"      on profiles for select using (auth.uid() = user_id);
create policy "users update own profile"   on profiles for update using (auth.uid() = user_id);
create policy "users insert own profile"   on profiles for insert with check (auth.uid() = user_id);

-- Auto-create profile when a user signs up
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============= Wardrobe items =============

create table wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category item_category not null,
  subcategory text,
  primary_colour text not null,
  secondary_colour text,
  brand text,
  material text,
  seasons text[] not null default array[]::text[],
  occasions text[] not null default array[]::text[],
  acquired_date date,
  acquired_source acquired_source default 'unknown',
  estimated_price int,
  condition item_condition not null default 'good',
  photo_url text,
  notes text,
  status item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table wardrobe_items enable row level security;

create policy "users manage own items" on wardrobe_items for all using (auth.uid() = user_id);

create index wardrobe_items_user_id_idx  on wardrobe_items(user_id);
create index wardrobe_items_category_idx on wardrobe_items(category);
create index wardrobe_items_status_idx   on wardrobe_items(status);

-- ============= Outfits =============

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  source outfit_source not null default 'user_logged',
  weather text,
  occasion text,
  worn_date date,
  ai_reasoning text,
  created_at timestamptz not null default now()
);

alter table outfits enable row level security;

create policy "users manage own outfits" on outfits for all using (auth.uid() = user_id);

create index outfits_user_id_idx   on outfits(user_id);
create index outfits_worn_date_idx on outfits(worn_date desc);

create table outfit_items (
  outfit_id uuid not null references outfits(id) on delete cascade,
  item_id   uuid not null references wardrobe_items(id) on delete cascade,
  role      text,
  primary key (outfit_id, item_id)
);

alter table outfit_items enable row level security;

create policy "users see own outfit items" on outfit_items for all using (
  outfit_id in (select id from outfits where user_id = auth.uid())
);

-- ============= Wear log =============

create table wear_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references wardrobe_items(id) on delete cascade,
  worn_date date not null,
  outfit_id uuid references outfits(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table wear_log enable row level security;

create policy "users manage own wear log" on wear_log for all using (auth.uid() = user_id);

create index wear_log_user_id_idx   on wear_log(user_id);
create index wear_log_item_id_idx   on wear_log(item_id);
create index wear_log_worn_date_idx on wear_log(worn_date desc);

-- ============= Marketplace listings =============

create table marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references wardrobe_items(id) on delete cascade,
  asking_price int not null,
  description text,
  status listing_status not null default 'active',
  listed_at timestamptz not null default now()
);

alter table marketplace_listings enable row level security;

create policy "authed users see active listings"
  on marketplace_listings for select to authenticated
  using (status = 'active' or seller_user_id = auth.uid());

create policy "users manage own listings"
  on marketplace_listings for all using (auth.uid() = seller_user_id);

create index marketplace_listings_status_idx          on marketplace_listings(status);
create index marketplace_listings_seller_user_id_idx  on marketplace_listings(seller_user_id);

-- ============= Eco brands directory (public read for verified) =============

create table eco_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  tags text[] not null default array[]::text[],
  image_url text,
  website_url text,
  category text,
  submission_status brand_submission_status default 'pending',
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table eco_brands enable row level security;

create policy "anyone reads verified brands"
  on eco_brands for select using (submission_status = 'verified');

create policy "authed users submit brands"
  on eco_brands for insert to authenticated
  with check (submitted_by = auth.uid() and submission_status = 'community-submitted');

-- ============= Upcycle tutorials (public read) =============

create table upcycle_tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  difficulty tutorial_difficulty not null default 'beginner',
  time_required text,
  materials_needed text[] not null default array[]::text[],
  steps jsonb,
  applicable_categories text[] not null default array[]::text[],
  image_url text,
  created_at timestamptz not null default now()
);

alter table upcycle_tutorials enable row level security;

create policy "anyone reads tutorials"
  on upcycle_tutorials for select using (true);

-- ============= Donation locations (public read) =============

create table donation_locations (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null,
  address text,
  lat double precision,
  lng double precision,
  accepts text[] not null default array[]::text[],
  notes text
);

alter table donation_locations enable row level security;

create policy "anyone reads donation locations"
  on donation_locations for select using (true);

-- ============= Did You Know facts (public read) =============

create table did_you_know_facts (
  id uuid primary key default gen_random_uuid(),
  fact text not null,
  source text,
  source_publication text,
  source_year int,
  source_url text,
  category text,
  confidence fact_confidence default 'industry-report',
  created_at timestamptz not null default now()
);

alter table did_you_know_facts enable row level security;

create policy "anyone reads facts"
  on did_you_know_facts for select using (true);

-- ============= Done =============
-- Next: run the seed inserts (separate file) and create storage buckets via the dashboard.
