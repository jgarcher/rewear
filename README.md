# ReWear

Working directory for the ReWear app build. Anna-Liv (founder) · JG (sponsor) · Claude (build partner).

## Quick links

- **Plan:** [`PLAN.md`](./PLAN.md) — multi-session execution plan
- **Decisions:** [`decisions/`](./decisions/) — ADRs as we lock things in
- **Notion working pages:**
  - [REWEAR APP — Anna-Liv](https://www.notion.so/REWEAR-APP-Anna-Liv-3516257fd35c8198bf9afd5855600b58) (parent)
  - [Interview 2026-04-29](https://www.notion.so/3516257fd35c807db4e3c552401dccee) (full transcript / decisions)
- **Live prototype:** https://reware-style-loop.base44.app/

## Status

**Phase 1–2 complete (Sessions 1–4).** Strategy, brand, product spec, taxonomy and impact methodology all locked.

- **Brand:** `BRAND.md` (consolidated from ADRs 001–010)
- **Product:** ADRs 011 (V1 scope), 012 (data model), 013 (screen IA), 014 (AI specs)
- **Taxonomy & impact:** ADRs 015 (controlled vocabulary), 016 (impact methodology with WRAP UK / Higg MSI / EMF sources)
- **Seed data:** `seed/wardrobe.json` (30 items), `seed/did-you-know.json` (15 sourced facts)

**Next:** Session 5 — Marketing site build &amp; deploy (Next.js + Tailwind on Vercel). First building session.

## Stack (confirmed)

- Next.js + Tailwind · Vercel (frontend)
- Supabase (Postgres + auth + storage)
- Anthropic SDK (Claude) — outfit gen, vision, coaching
- TBD image-gen model — chosen in Session 9
- Domain: `rewear.ai` (pending purchase)

## Conventions

- **UK English** in all copy and code (colour, behaviour, organise, etc.)
- **All Claude output for Notion goes to AI Drafts first** (per JG's CLAUDE.md). This rule applies to PBP work — **for ReWear** we work directly in this `/projects/rewear/` directory and Anna-Liv's Notion pages with no AI Drafts overhead.
- **Anna-Liv approves brand and AI behaviour decisions.** JG approves architecture, budget, and timeline.

## Open alignment questions (waiting on JG / Anna-Liv)

1. Buy `rewear.ai` domain now (~£100/yr)? *Recommend yes — locks the name and avoids rework.*
2. GitHub repo: public (good for portfolio) or private? *Recommend public.*
3. Anthropic API key — separate from Claude Max for production? *Will need eventually; OK for Sessions 1–4 without.*
4. Anna-Liv's involvement cadence: every session, or just gates? *Recommend gates: Session 1 (brand), 2 (logo), 3 (scope), 8 onwards (each AI demo), 14 (launch).*
5. School project deadline? *Sets v1 ship target. Without one, default = end of June 2026.*
6. Lead positioning: 20–30 eco-conscious primary, OR lean into kids-upcycling secondary? *I think this is a real strategic question for Session 1.*
7. Logo: AI-generated concept first (cheaper, faster) or commission designer up front? *Recommend AI-first.*
8. Wardrobe spreadsheet — when can Anna-Liv start cataloguing? *Blocking AI sessions; not blocking Sessions 1–6.*

## Working sessions

| # | Phase | Status |
|---|---|---|
| 1 | Positioning & voice | Pending alignment |
| 2 | Visual identity | — |
| 3 | V1 feature scope & IA | — |
| 4 | Clothing taxonomy & impact methodology | — |
| 5 | Marketing site | — |
| 6 | App foundations | — |
| 7 | Core wardrobe | — |
| 8 | AI: Outfit Generator | — |
| 9 | AI: Upcycle image gen | — |
| 10 | AI: Auto-tagging | — |
| 11 | AI: Upcycling Coach | — |
| 12 | Marketplace + Eco Brands + Donation | — |
| 13 | Email ingestion onboarding | — |
| 14 | Launch & showcase | — |
