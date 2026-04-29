# ADR 011 — V1 scope (school-demo cut)

**Date:** 2026-04-29
**Status:** Recommended — awaiting Anna-Liv / JG sign-off
**Decided in:** Session 3

We split into two clear releases. **V1 is what we ship for the school demo and AnnaLiv-uses-it-herself.** V2 is everything else. Keeping V1 narrow is how we ship something polished instead of half-built.

---

## V1 — what's IN

### Screens
- **Home** — streak, impact tracker, AI outfit-of-the-day, "Did You Know" feed, items-tracked count, quick links
- **Wardrobe** — browse, add item (photo + auto-tag), wear-count, last-worn, search, filter by category
- **Item detail** — photo, all metadata, edit, mark as worn (today / yesterday), list for resale, mark for donation, mark for upcycling
- **Outfit Generator** — pick occasion / weather / vibe → AI suggests outfit from wardrobe, prioritises underworn, lets you accept / shuffle / reject
- **Eco Brands** — curated directory (already mostly built in Base44)
- **Upcycle** — static tutorials with text-only AI suggestions ("3 ways to restyle this jumper")
- **Resell** — listing UI, browse, marketplace stub (NO real payments)
- **Donation** — locator with geolocation, nearest stores, links
- **Profile / Settings** — basic auth, sign-out

### AI features
- ✅ **Outfit Generator** (priority 1 — the wow moment)
- ✅ **Auto-tag on upload** (priority 3 — needed because manual entry kills onboarding)

### Users
- **Single user for demo** (Anna-Liv signed in)
- Auth works, schema multi-tenant from day one — no rebuild needed when we open up

### Content
- Seed wardrobe (30 items) — see `seed/wardrobe.json`
- Eco brands list (already curated in Base44 — port over)
- "Did You Know" facts (~15 sourced from WRAP UK, Ellen MacArthur, Higg MSI — see Session 4)

---

## V1 — what's OUT (deferred to V2)

| Deferred | Why |
|---|---|
| **Image gen for upcycle visualisations** (AI #2) | Cost + complexity; static tutorials work for demo |
| **Upcycling Coach conversational** (AI #4) | Text suggestions cover the use case for v1 |
| **Email-ingestion onboarding** | Big build; the seed wardrobe + auto-tag covers demo |
| **Real marketplace transactions** | Legal / payments / tax complexity |
| **Multi-user / community features** | Single-user demo is enough |
| **Notifications / reminders** | Not load-bearing for showcase |
| **Native mobile app** | PWA on phones is fine for demo |
| **Sarah persona (kids upcycling)** | Maya-only for v1 |

---

## Demo success criteria

A 5-minute walkthrough that shows:
1. Anna-Liv opens the app on her phone
2. Streak, impact, today's AI outfit visible on home in <1 second
3. Wardrobe with 30 real-looking items, photos, wear-counts
4. Tap "outfit for school" → AI generates a complete outfit using the wardrobe, with reasoning
5. Add a new item by photo — auto-tag fills the categorisation, she edits if wrong
6. Browse Eco Brands, tap one, see info
7. Browse Upcycle, see 3 tutorials, AI offers 2 alternatives for one item
8. List a sweater for resale (UI only)
9. Find nearest H&M donation point on map

If this works smoothly on her phone, V1 is shipped.
