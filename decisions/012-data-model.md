# ADR 012 — Data model (V1)

**Date:** 2026-04-29
**Status:** Locked v1 — will refine as we hit feature work
**Decided in:** Session 3

This is the Supabase schema we'll deploy in Session 6. Designed multi-tenant from day one so V2 doesn't require a rebuild.

---

## Tables

### `users`
Standard Supabase auth user. We extend with profile fields below.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | Supabase auth |
| `email` | text | Supabase auth |
| `display_name` | text | "Maya" |
| `created_at` | timestamptz | |

### `profiles`
Per-user profile metadata.

| Field | Type | Notes |
|---|---|---|
| `user_id` | uuid (fk → users) | pk |
| `streak_count` | int | days in a row outfit logged |
| `last_logged_date` | date | for streak calc |
| `lifetime_rewears` | int | total times user logged a wear |
| `created_at` | timestamptz | |

### `wardrobe_items` ⭐ core table

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `user_id` | uuid (fk → users) | RLS isolates per user |
| `name` | text | "Cream silk camisole" |
| `category` | enum | `top`, `bottom`, `tshirt`, `dress`, `coat`, `shoes`, `accessory` |
| `subcategory` | text | "blouse", "jeans", "trainers" — free text for v1 |
| `primary_colour` | text | "cream" |
| `secondary_colour` | text \| null | for patterns |
| `brand` | text \| null | "Cos" |
| `material` | text \| null | "silk", "cotton", "wool" |
| `seasons` | text[] | array: `winter`, `spring`, `summer`, `autumn`, `all` |
| `occasions` | text[] | array: `casual`, `work`, `evening`, `athletic`, `special` |
| `acquired_date` | date \| null | when bought / received |
| `acquired_source` | enum | `new`, `sale`, `vinted`, `depop`, `charity-shop`, `gift`, `hand-me-down` |
| `estimated_price` | int \| null | GBP, used for resell suggestion |
| `condition` | enum | `new`, `like-new`, `good`, `worn-in`, `needs-mending` |
| `photo_url` | text | Supabase storage path |
| `notes` | text \| null | user's free text |
| `status` | enum | `active`, `listed`, `donated`, `upcycled`, `retired` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `wear_log`
Every time a user marks an item as worn.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `user_id` | uuid (fk) | |
| `item_id` | uuid (fk → wardrobe_items) | |
| `worn_date` | date | when, not when-logged |
| `outfit_id` | uuid \| null | groups items worn together |
| `created_at` | timestamptz | |

**Derived:** `wear_count` and `last_worn_date` are SQL views over `wear_log`, not stored fields.

### `outfits`
A grouping of items worn together (or an AI-suggested combo).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `user_id` | uuid (fk) | |
| `name` | text \| null | optional, AI can name them |
| `source` | enum | `user_logged`, `ai_generated`, `ai_accepted` |
| `weather` | text \| null | "rainy 12°C" |
| `occasion` | text \| null | "school", "going out" |
| `worn_date` | date \| null | null if just-suggested-not-yet-worn |
| `created_at` | timestamptz | |

### `outfit_items`
Many-to-many link.

| Field | Type | Notes |
|---|---|---|
| `outfit_id` | uuid (fk) | |
| `item_id` | uuid (fk) | |
| Composite PK: (outfit_id, item_id) | | |

### `eco_brands`
Curated directory.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `name` | text | "Patagonia" |
| `description` | text | |
| `tags` | text[] | `recycled-materials`, `fair-trade`, `take-back` |
| `image_url` | text | |
| `website_url` | text | |
| `category` | text | `outdoor`, `everyday`, `denim`, `accessories` |
| `submission_status` | enum | `verified`, `pending`, `community-submitted` |
| `created_at` | timestamptz | |

### `upcycle_tutorials`
Static tutorials, can grow into a CMS later.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `title` | text | "Jeans → cut-off shorts" |
| `difficulty` | enum | `beginner`, `intermediate`, `advanced` |
| `time_required` | text | "30 minutes" |
| `materials_needed` | text[] | |
| `steps` | jsonb | structured steps |
| `applicable_categories` | text[] | which item categories this works for |
| `image_url` | text | |
| `created_at` | timestamptz | |

### `donation_locations`
Static-ish list, eventually pull from external source.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `partner_name` | text | "H&M Conscious" |
| `address` | text | |
| `lat` | float | |
| `lng` | float | |
| `accepts` | text[] | "all clothing", "shoes only" |
| `notes` | text | |

### `marketplace_listings` (V1 = UI only, no payments)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `seller_user_id` | uuid (fk) | |
| `item_id` | uuid (fk → wardrobe_items) | |
| `asking_price` | int | GBP |
| `description` | text | |
| `status` | enum | `active`, `pending`, `sold`, `withdrawn` |
| `listed_at` | timestamptz | |

### `did_you_know_facts`
Eco-content feed.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `fact` | text | |
| `source` | text | "WRAP UK", "Ellen MacArthur Foundation" |
| `source_url` | text | |
| `category` | text | `water`, `carbon`, `microplastic`, `economic` |
| `confidence` | enum | `peer-reviewed`, `industry-report`, `general-knowledge` |
| `created_at` | timestamptz | |

---

## Row-Level Security

Every user-owned table (`wardrobe_items`, `wear_log`, `outfits`, `marketplace_listings`) gets RLS:

```sql
create policy "users see only their own items"
on wardrobe_items for all
using (user_id = auth.uid());
```

Even with V1 single-user, RLS is on. Saves work later.

---

## Storage buckets (Supabase Storage)

- `wardrobe-photos/` — user-uploaded item photos, RLS-protected by user_id
- `eco-brand-logos/` — public, curated
- `tutorial-images/` — public, curated
