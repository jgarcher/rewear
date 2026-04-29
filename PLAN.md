# ReWear — Multi-Session Build Plan

**Owner:** Anna-Liv (founder/director) · JG (executive sponsor) · Claude (build partner)
**Status:** Phase 0 — alignment
**Last updated:** 2026-04-29

---

## What ReWear is

An eco-conscious fashion app that helps people **wear more and waste less**. Track what you own, get AI-generated outfits from your existing wardrobe, learn to upcycle, resell what you don't need, and discover eco-conscious brands.

- **Name:** ReWear (locked)
- **Tagline:** "Wear More, Waste Less." (locked)
- **Domain target:** `rewear.ai` (~£100/yr — pending purchase decision)
- **Founder:** Anna-Liv. Started as a school project; expanding into a real product.

## Audience

- **Primary:** 20–30s, eco-conscious, disposable income
- **Secondary:** families with multiple kids — outgrown-clothes upcycling angle (underexplored)
- **Tertiary:** anyone who wears clothes and wants to reduce fast-fashion habit

## Brand foundations (to be locked in Session 1–2)

- **Voice anchor:** "Wear More, Waste Less." Direct, contrastive, on-mission.
- **Visual register:** clean, minimal, earthy (green / cream / charcoal). Mature but with energy.
- **Experiential reference:** Pinterest — discoverable, image-led, idea-generating
- **Logo concept:** patchwork-recycle (different fabrics/patterns woven into the recycle symbol)

## Tech stack (confirmed)

- **Frontend (app + marketing site):** Next.js + Tailwind CSS, deployed to Vercel
- **Backend / data:** Supabase (Postgres + auth + storage)
- **AI:** Anthropic SDK (Claude) — outfit reasoning, vision, upcycling coach
- **Image gen:** Flux Schnell / Imagen / similar — chosen in Session 9
- **Weather (for outfit gen):** OpenWeather API or similar
- **Email ingestion (v2):** Inbound email service (Postmark / SendGrid Inbound)

---

## AI feature priority (locked, from interview)

1. **Outfit Generator** — Claude reasons over wardrobe + weather + occasion, prioritises underworn items
2. **Image Generation of upcycled looks** — visualise what an item could become before making it
3. **Auto-tagging on upload** — Claude vision categorises clothing photos
4. **Upcycling Coach** — conversational, grounded in user's wardrobe + skill level

---

## The plan: 9 phases, ~14 sessions

### Phase 1 — Strategic foundations (Sessions 1–2)

**Session 1 — Positioning & voice**
- 3 positioning angles for Anna-Liv to pick (incl. kids-upcycling angle)
- Brand voice profile (Build mode, anchored on "Wear More, Waste Less.")
- Manifesto / "why we exist"
- Audience persona doc

**Session 2 — Visual identity**
- Logo concepts — 3 patchwork-recycle directions
- Final logo + wordmark
- Colour system, typography pair, iconography style
- Design tokens

### Phase 2 — Product definition (Sessions 3–4)

**Session 3 — V1 feature scope & IA**
- School-demo cut + real-product roadmap
- Screen-by-screen IA, every state
- AI behaviour specs (input → output for each AI feature)
- Supabase data model

**Session 4 — Clothing taxonomy & impact methodology**
- Clothing data spec (types, colours, materials, occasions, seasons)
- **Defendable impact algorithm** with credible sources (Higg MSI, WRAP UK, Ellen MacArthur)
- "Did You Know" content sourcing plan

### Phase 3 — Marketing site (Session 5)

- Next.js + Tailwind site at `rewear.ai`
- Hero / manifesto / how-it-works / waitlist / about
- Direct-response copy throughout

### Phase 4 — App foundations (Session 6)

- Next.js app at `app.rewear.ai`
- Supabase auth (Anna-Liv + 1 friend)
- Schema deployed
- Empty shell of every screen, navigation working
- Design system installed

### Phase 5 — Core wardrobe (Session 7)

- Photo upload → Supabase storage
- Item CRUD with full taxonomy
- Wear-count tracking
- Daily outfit log + streak engine
- Impact tracker on Home (using Phase 2 algorithm)
- "Did You Know" feed

### Phase 6 — AI capabilities (Sessions 8–11)

**Session 8 — AI #1: Outfit Generator**
- Claude reasoning over wardrobe + weather + occasion
- Underworn-item prioritisation
- Prompt caching for wardrobe context

**Session 9 — AI #2: Upcycle image generation**
- Choose model, build image-to-image flow
- Cost guardrails

**Session 10 — AI #3: Auto-tagging**
- Claude vision: photo → categorised item
- Confidence threshold + manual override

**Session 11 — AI #4: Upcycling Coach**
- Conversational, grounded in user wardrobe + skill level
- Repeatable upcycling tutorial framework
- "Which of my items pair for this project?"

### Phase 7 — Ecosystem features (Session 12)

- Marketplace (fix self-purchase bug, listing flow, browse, message stubs)
- Eco Brands directory + submission form
- Donation locator (geolocation)

### Phase 8 — Onboarding innovation (Session 13)

- Inbound email (`add@rewear.ai`)
- Parse H&M / Zara / ASOS confirmations into wardrobe items
- Retrospective Gmail search (likely v2)

### Phase 9 — Launch & showcase (Session 14)

- Walk-through demo script
- Brief for the 3 schoolmates' video production
- Social atomisation (TikTok / Instagram)
- Press kit / one-pager

---

## Hard problems on watch

| Problem | Severity | Plan |
|---|---|---|
| Impact algorithm credibility | High | Use peer-reviewed LCA sources (WRAP UK, Higg MSI). Show *fewer* but defendable numbers. Cite. |
| Image-gen cost control | Medium | Cache aggressively. Default to Flux Schnell or similar low-cost model. Cap per-user calls. |
| Patchwork-recycle logo execution | Medium | Generate 3 AI directions first; commission designer (£200–500) only if needed. |
| Email-ingestion legal/auth complexity | Medium | Inbound forwarding only for v1. Gmail OAuth integration is v2. |
| Marketplace self-purchase bug | Low | Logic fix during Session 12. |

---

## Decisions log

See `decisions/` for ADRs as we lock things in.

## Open alignment questions

See `README.md` for the live list. Will be cleared as JG / Anna-Liv answer.
