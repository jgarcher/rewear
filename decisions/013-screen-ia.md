# ADR 013 — Screen-by-screen Information Architecture (V1)

**Date:** 2026-04-29
**Status:** Locked v1
**Decided in:** Session 3
**Scope:** Every screen, every state, every interaction for the V1 release.

This is the spec the engineer (or AI agent) builds from. Mobile-first PWA — designed to feel like an app on a phone, with desktop as a graceful adaptation.

---

## 1. Navigation system

### Bottom tab bar (5 tabs, mobile)

```
🏠 Home   👕 Wardrobe   ✨ Outfit   🌿 Discover   👤 Profile
```

| Tab | Purpose |
|---|---|
| **Home** | Daily hub. Streak, today's AI outfit, impact, Did You Know |
| **Wardrobe** | Browse, search, filter, add items |
| **Outfit** | AI Outfit Generator — the wow feature, dedicated tab |
| **Discover** | Eco Brands + Upcycle Tutorials + Donation Map |
| **Profile** | Settings, listings, stats, account |

### Routing structure

```
/                      → Home (auth-gated; redirects to /signin if logged out)
/signin                → Sign in (magic link)
/onboarding            → First-time setup
/wardrobe              → Wardrobe browse
/wardrobe/add          → Add item flow
/wardrobe/:id          → Item detail
/wardrobe/:id/edit     → Edit item
/outfit                → AI Outfit Generator (input form)
/outfit/result/:id     → Outfit result
/discover              → Discover landing (3 sub-sections)
/discover/brands       → Eco Brands directory
/discover/brands/:id   → Brand detail
/discover/upcycle      → Upcycle Tutorials list
/discover/upcycle/:id  → Tutorial detail
/discover/donate       → Donation map
/profile               → Profile dashboard
/profile/settings      → Settings
/profile/listings      → My marketplace listings
```

---

## 2. Auth flow

### `/signin`
**Purpose:** Magic-link sign-in via Supabase auth.

**Layout:**
- Centred card on linen background
- Embroidered ReWear logo at top (small)
- Wordmark "ReWear" in Fraunces 600
- Tagline "Wear More. Waste Less." below
- Email input
- Primary button: "Send magic link"
- Footer: "By signing in you agree to our terms" (linked)

**States:**
- Default → form ready
- Submitting → button shows spinner, "Sending..."
- Success → "Check your email — we've sent you a link."
- Error → "That didn't work. Try again."

**Voice copy:**
- Headline: *"Welcome to ReWear."*
- Sub: *"Open your closet, not another app."*

### `/onboarding`
**Purpose:** First-time user setup.

**Layout (3 steps):**
1. **Welcome** — "Let's set up your wardrobe."
2. **Import options** — three tiles:
   - "Add items one by one" (manual, photo + auto-tag)
   - "I'll do it later" (skip — show empty wardrobe)
   - *(V2 unlock: "Forward me your order emails" — greyed out with "Coming soon")*
3. **Profile** — display name + optional photo, then "Done."

After: routed to Home.

---

## 3. Home (`/`)

**Purpose:** Daily check-in. Streak + today's outfit + impact + a small fact.

### Layout (top to bottom)

1. **Greeting + streak** (sticky top)
   - *"Morning, Maya."* (or *Afternoon* / *Evening* based on time)
   - Streak indicator: *"🔥 6 days in a row"* (Phosphor flame icon, forest)

2. **Today's outfit card** (hero, 60% of viewport)
   - Background: linen with subtle weave
   - Items composited (3–5 small thumbnails of the suggested outfit)
   - Below: AI reasoning text in voice
     > *"The forest merino, vintage 501s, white Vejas. The merino's been quiet since Tuesday."*
   - Two buttons: **"Wear this"** (primary, forest) · **"Shuffle"** (sage outline)
   - Tertiary link: *"Pick a different occasion →"* (links to `/outfit`)

3. **Impact tile** (compact card)
   - Icon: Phosphor leaf, sage
   - *"This year: 47 re-wears · ~640 L water saved · ~12 kg CO₂ avoided"*
   - Source caveat: small "(WRAP UK methodology — see how)" link

4. **Did You Know card** (compact card, rotates daily)
   - Icon: Phosphor info, clay
   - One-paragraph fact with source attribution
   - Example: *"It takes around 2,700 litres of water to make one cotton T-shirt — about 3 years of drinking water for one person. — WRAP UK"*

5. **Quick links** (3 small cards)
   - "Add to wardrobe" → `/wardrobe/add`
   - "List something for sale" → `/wardrobe` (with filter for sellable)
   - "Find a donation point" → `/discover/donate`

### States

| State | What shows |
|---|---|
| **First-time / empty wardrobe** | Skip outfit card. Show *"Your closet's empty. Let's add your first piece."* with single CTA |
| **<5 items** | Show outfit card with reduced suggestion: *"Add a few more pieces and we'll start building outfits."* |
| **Loading outfit** | Skeleton card |
| **AI fail** | *"We couldn't pick an outfit just now. Try again or pick something yourself."* |
| **Streak broken yesterday** | Banner: *"Welcome back. Let's start a new streak."* |

---

## 4. Wardrobe (`/wardrobe`)

**Purpose:** Browse, search, filter, manage every item.

### Layout

1. **Top bar**
   - Title "Wardrobe" (Fraunces 500)
   - Search input (Phosphor magnifying glass)
   - Filter button → opens bottom sheet

2. **Filter chips** (horizontal scroll under top bar)
   - All · Tops · Bottoms · T-shirts · Dresses · Coats · Shoes
   - Multi-select chips below: Underworn · This season · For sale · Recently added

3. **Item grid** (2 columns mobile, 4 desktop)
   - Each card: photo + name + small wear-count badge
   - Wear-count badge colour:
     - Forest if worn ≥10 times
     - Charcoal if 1–9
     - Clay if 0 (never worn — gentle flag)
   - Tap → `/wardrobe/:id`

4. **FAB (Floating Action Button)** bottom-right
   - Forest circle, Phosphor plus
   - Tap → `/wardrobe/add`

### States

| State | What shows |
|---|---|
| **Empty** | Centred illustration (cream) + *"Your wardrobe's empty. Let's add your first piece."* + primary CTA |
| **Filtered → 0** | *"Nothing matches that. Try fewer filters."* |
| **Loading** | Skeleton grid |
| **Search no results** | *"Nothing in your closet called that."* |

### Voice copy

- Filter chip "Underworn": *"Underworn"* (no extra text)
- Filter chip "This season": *"This season"*
- Empty state CTA: *"Add your first piece"*

---

## 5. Add item flow (`/wardrobe/add`)

**Purpose:** Capture a new wardrobe item with minimum friction. Auto-tag is the magic.

### Step 1 — Capture
- Two big buttons:
  - **"Take a photo"** (opens camera)
  - **"Choose from library"**
- Smaller: "Add manually" (text only)
- Voice copy: *"Snap it. We'll figure out what it is."*

### Step 2 — Auto-tag review
- Photo at top
- Below: AI-suggested fields, each pre-filled with confidence indicator
  - Category: Top ✓ (high confidence)
  - Subcategory: Knit jumper ✓ (high)
  - Primary colour: Forest green ✓ (high)
  - Material: Wool? (medium — tappable to confirm)
  - Brand: *(empty — user adds)*
  - Season: Autumn, winter, spring (chips, edit-tap)
  - Occasion: Casual, work (chips, edit-tap)
- Voice copy at top:
  > *"Looks like a forest-green knit jumper. Edit anything we got wrong."*
- Bottom buttons: **"Save"** (primary) · **"Add details"** (expand for brand, price, condition, notes)

### Step 3 — Optional details (expandable)
- Brand
- Acquired date (default: today)
- Acquired source (chips: New / Sale / Vinted / Depop / Charity shop / Gift / Hand-me-down)
- Estimated price
- Condition (chips: New / Like-new / Good / Worn-in / Needs mending)
- Notes (free text)

### Step 4 — Confirmation
- Brief animation, item card flies into wardrobe grid
- Toast: *"Added to your closet."*
- Returns to `/wardrobe` with new item highlighted

### States

| State | Behavior |
|---|---|
| **Auto-tag fails** | Manual fallback: *"We couldn't quite read this one. Fill in the basics?"* |
| **Photo too dark** | *"This shot's a bit dark — try again with more light?"* (don't block, just suggest) |
| **Multiple items in photo** | *"Looks like a few things in there. Can you focus on one?"* |
| **Saving** | Button spinner |
| **Save failed** | Toast error, retry option |

---

## 6. Item detail (`/wardrobe/:id`)

**Purpose:** Single source of truth for one garment. All actions live here.

### Layout

1. **Hero photo** (full-width, edge-to-edge)
2. **Title + brand** (Fraunces 500 + Inter sm secondary)
3. **Stats row** (3 small cards)
   - Worn: 24 times
   - Last worn: 3 days ago
   - Bought: Jan 2025 from Cos
4. **Action row** (horizontal buttons)
   - Mark as worn (forest, primary)
   - Restyle ideas (sage, opens upcycle suggestions modal)
   - List for sale (clay, opens listing flow)
   - Donate (subtle text link — opens donation modal)
5. **Details accordion** (expandable)
   - Material, season, occasion, condition, notes, acquired source, estimated price
6. **Edit / Delete** (top-right menu)

### Mark-as-worn modal

- *"When did you wear this?"*
- Quick options: Today / Yesterday / Pick a date
- Optional: *"Was it part of an outfit?"* → multi-select other wardrobe items
- Save → updates `wear_log` + closes modal

### Restyle ideas (V1: text-only)

- Modal with 3 AI-generated text suggestions
- Voice copy: *"Three things you could do with this jumper:"*
  - "Cut into a cropped pullover — pair with high-waist jeans"
  - "Layer over the cream silk cami for a tonal autumn look"
  - "Felt-shrink it intentionally for a denser texture"
- Each idea: tap for "save to ideas" (V2) / share

### List for sale flow

- Pre-fills asking price (estimated_price × 0.5 default, editable)
- Description (text area, AI-suggested opener: *"Cos forest merino, hardly worn, beautiful colour."*)
- Confirm → status changes to `listed`
- Item appears in `/profile/listings`

---

## 7. Outfit Generator (`/outfit`)

**Purpose:** The wow feature. AI builds an outfit from the wardrobe, contextual to weather/occasion.

### Input screen

1. **Title:** *"What's the day looking like?"*
2. **Weather card** (auto-detected via geolocation)
   - *"Rainy, 12°C in East London"* (editable if user wants to plan ahead)
3. **Occasion** (chip select, single)
   - School · Work · Going out · Errands · Special · Just home
4. **Vibe** (chip select, optional, single)
   - Cosy · Sharp · Easy · Dressed-up · Surprise me
5. **Big primary button:** *"Build my outfit"*

### Loading state

- Skeleton with subtle thread-loop animation (call back to embroidery)
- Voice text: *"Looking through your closet…"*

### Result screen (`/outfit/result/:id`)

1. **Outfit visualisation**
   - Items shown stacked / overlapped in a "flat lay" composition
   - 3–5 thumbnails labelled
2. **AI reasoning** (in voice)
   > *"The forest merino, vintage 501s, white Vejas. The merino's been quiet since Tuesday. Chore coat for the rain."*
3. **Action row**
   - **"Wear this"** (primary, forest) — logs the outfit, returns to Home
   - **"Shuffle"** (sage outline) — re-runs AI with same inputs, exclude these items
   - **"Save for later"** (text link) — saves but doesn't log
4. **Item list** (vertical, tappable) — each item links to its detail page

### States

| State | Behavior |
|---|---|
| **Wardrobe too small (<5 items)** | *"Add a few more pieces and we'll start building outfits."* with link to `/wardrobe/add` |
| **AI returns nothing** | *"We couldn't put one together. Try a different occasion?"* |
| **Same items as last time** | Banner: *"You've seen this combo recently — shuffle for fresh ones."* |

---

## 8. Discover (`/discover`)

**Purpose:** Three sub-sections — Eco Brands, Upcycle Tutorials, Donation Map. Where Maya goes when she's not getting dressed.

### Landing layout

- Three large tiles (vertical stack on mobile, 3-col on desktop)
  - **Eco Brands** — *"Brands worth buying from."*
  - **Upcycle** — *"Make something new from what you have."*
  - **Donate** — *"Find a home for what you can't keep."*

### `/discover/brands`
- Grid of brand cards (image + name + 3 tags)
- Filter chips at top: Recycled · Fair-trade · Take-back · Carbon neutral · Repair programme
- Tap → brand detail
- "Submit a brand" link at bottom (form for community submissions)

### `/discover/brands/:id`
- Hero image
- Name + tags
- Description (curated, voice-y)
- "Why we like them" section (1 paragraph)
- "Visit site" external link button

### `/discover/upcycle`
- Grid of tutorial cards (image + title + difficulty badge + time)
- Filter chips: Beginner · Intermediate · Advanced · Quick (<30min) · Weekend project
- Tap → tutorial detail

### `/discover/upcycle/:id`
- Hero image
- Title + difficulty + time + materials list
- Steps (numbered, with sub-images)
- Bottom: *"Pieces in your closet you could use this for"* — links to wardrobe items that match

### `/discover/donate`
- Map view (default) with pins for nearby donation points
- Below map: list of locations sorted by distance
- Each location: partner name + address + accepts (e.g., "all clothing, shoes")
- Tap pin or list item → modal with details + "Open in Maps" link

---

## 9. Profile (`/profile`)

**Purpose:** Account, listings, stats, settings.

### Layout

1. **Profile header**
   - Avatar (default: initial circle in forest)
   - Name (Fraunces 500)
   - Joined date

2. **Stats summary** (3 small cards)
   - Items in wardrobe: 30
   - Lifetime re-wears: 247
   - Currently listed: 2

3. **My Listings** (compact list of active marketplace listings)

4. **Menu** (vertical nav)
   - Settings → `/profile/settings`
   - About ReWear (manifesto)
   - Help / FAQ
   - Sign out

### `/profile/settings`
- Display name (editable)
- Email (read-only)
- Notifications (toggles — daily outfit reminder, weekly summary, marketplace messages)
- Theme (light only V1; dark deferred)
- Data export (CSV of wardrobe + wear log)
- Delete account
- Sign out

---

## 10. Cross-cutting patterns

### Empty states

Always include:
- A short, voice-y line (no platitudes)
- A clear primary action
- An optional secondary "learn more"

Examples:
- Empty wardrobe: *"Your closet's empty. Let's add your first piece."*
- No outfits yet: *"No outfits saved. Build one when you're getting ready."*
- No listings: *"Nothing listed. Mark anything from your wardrobe to sell."*

### Loading states

- Skeleton screens (not spinners) for content
- Spinner only for short actions (button submit)
- For AI generation: animated thread-loop / subtle stitching motion (~1.5s)
- Always with a voice line: *"Looking through your closet…"*, *"Stitching that together…"*

### Error states

- One sentence explaining what's wrong (no jargon)
- One clear next step
- Never blame the user

Examples:
- Network: *"Lost the connection. Try again?"*
- AI fail: *"That didn't work. Want to try again?"*
- Auth expired: *"Let's sign you back in."*

### Modal patterns

- Bottom sheets on mobile (slide up)
- Centre modals on desktop
- Always have a close X (top-right)
- Primary action bottom-right, secondary bottom-left

### Toast notifications

- Forest background, linen text
- Bottom of screen, 3-second auto-dismiss
- Used for: item added, item saved, listing created, sign-in success

---

## 11. Responsive behaviour

- **Mobile (default):** bottom tab nav, single-column lists, full-width hero cards
- **Tablet:** bottom tab nav stays, content widens to 2 columns where useful
- **Desktop:** sidebar nav (left) + content area (centre), 3+ column grids, larger hero hero
- All breakpoints: keep the tagline visible on every page (small footer)

---

## 12. What to build first (Session 5/6 sequencing)

1. Auth + onboarding (`/signin`, `/onboarding`)
2. Home shell (with skeleton states — content comes Session 7)
3. Wardrobe browse + item detail (Session 7)
4. Add item flow with placeholder auto-tag (Session 7)
5. Outfit Generator (Session 8)
6. Auto-tag AI integration (Session 10)
7. Discover sections (Session 12)
8. Profile + listings (Session 12)
