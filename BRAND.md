# ReWear — Brand Book

**Version:** 1.0 · **Date locked:** 2026-04-29 · **Owner:** Anna-Liv

This is the single source of truth for the ReWear brand. Hand this to any designer, developer, agency, or AI before they produce anything. Every decision below is locked.

For the full reasoning behind each decision, see the corresponding ADR in `decisions/`.

---

## 1. Brand at a glance

| Element | Locked decision |
|---|---|
| **Name** | ReWear |
| **Tagline** | *Wear More. Waste Less.* |
| **Hero line** | *Open your closet, not another app.* |
| **Positioning** | The Everything Wardrobe — outfits + upcycle + resell + donate + eco-brands, all in one app |
| **Primary user** | Maya, 26, East London, eco-conscious, wardrobe-overwhelmed |
| **Voice** | Cool older sister — observational, lightly witty, quietly confident, never preachy |
| **Visual register** | Refined, embroidered, textile, premium, quiet |
| **Anti-everything** | No leaves. No earth-day pastel. No hustle slang. No emoji excess. No preaching. |

---

## 2. Logo

### Primary mark

**File:** `assets/logo/rewear-logo-primary.png`

A recycle symbol — three looping arrows — embroidered onto natural cream linen. Each arrow uses a different high-end embroidery technique:

| Position | Stitch | Heritage |
|---|---|---|
| Top | **Sashiko** running stitch (parallel dashed lines) | Japanese visible-mending tradition |
| Bottom-left | **Satin** stitch (smooth filled) | Classic couture finishing |
| Bottom-right | **Tambour** chain stitch (looped chain) | Haute couture (Lesage atelier) |

All in deep forest-green thread (`#2D6A47`) on cream linen ground (`#F5F0E6`).

### Logo do's

- ✅ Use the full primary mark wherever space and resolution allow
- ✅ Maintain clear space equal to one arrow-width on every side
- ✅ Keep the linen texture visible at hero sizes
- ✅ Pair with the wordmark in **Fraunces** (see Typography)

### Logo don'ts

- ❌ Don't recolour to multi-thread
- ❌ Don't add metallic, beading, or sequins
- ❌ Don't separate the three arrows
- ❌ Don't place on busy or photographic backgrounds
- ❌ Don't crop into the linen field — the fabric is part of the mark
- ❌ Don't rotate, skew, or distort
- ❌ Don't add drop shadows beyond the natural thread shadow already in the artwork

### Variants needed (see `assets/README.md` for status)

| Variant | Purpose | Status |
|---|---|---|
| Primary mark on linen | Hero, About, press kit | ✅ Locked |
| Mark only — full colour, transparent BG | App icon, social avatar | ⏳ To generate |
| Mark only — monochrome cream on forest | Dark backgrounds, hero placements | ⏳ To generate |
| Wordmark "ReWear" | Footer, secondary placements | ⏳ To set in Fraunces |
| Primary lockup (mark + wordmark + tagline) | Marketing hero, press kit | ⏳ To compose |
| Favicon (32×32 silhouette) | Browser tabs | ⏳ To simplify from primary |

---

## 3. Colour palette

Full token system in **ADR 007**. Headlines:

### Five base colours

| Colour | Hex | Use |
|---|---|---|
| 🌲 **Forest** | `#2D6A47` | Brand primary, logo thread, primary buttons |
| 🌾 **Linen** | `#F5F0E6` | Page background, fabric ground, surfaces |
| ⬛ **Charcoal** | `#1A1A1A` | Body text, headlines |
| 🏺 **Clay** | `#C2876B` | Warm accent — donation, low-wear flags |
| 🌿 **Sage** | `#7A8B6C` | Secondary accent — secondary actions, subtle states |

Always use the token system (`--rw-forest-500`, `--rw-linen-100` etc.) — see ADR 007 for the full scale, including hover states, text variants, and semantic colours.

---

## 4. Typography

**Headings:** [Fraunces](https://fonts.google.com/specimen/Fraunces) — Google Fonts, free
**Body / UI:** [Inter](https://fonts.google.com/specimen/Inter) — Google Fonts, free
**Icons:** [Phosphor Icons](https://phosphoricons.com/) — free, MIT, line style, regular weight

### Type scale

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12px | Metadata, timestamps |
| `text-sm` | 14px | Labels, secondary UI |
| `text-base` | 16px | Body |
| `text-lg` | 18px | Lead paragraphs, AI suggestions |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Section headings |
| `text-3xl` | 30px | Page headings |
| `text-4xl` | 36px | Hero supporting |
| `text-5xl` | 48px | Hero (mobile) |
| `text-7xl` | 72px | Hero (desktop) |

### Pairing rules

- Always Fraunces for headlines and pull-quotes; always Inter for body and UI
- Never mix serif and sans within a sentence
- Tagline ("Wear More. Waste Less.") sets in Fraunces 600

---

## 5. Voice

Full voice profile in **ADR 002**. Key rules:

### Voice in one paragraph

ReWear sounds like the **cool older sister** who knows her wardrobe inside out and tells you — kindly but directly — what to wear. She's observational, lightly witty, quietly confident, with a small streak of mischief. She never lectures about sustainability. She just makes wearing what you already own look like the obvious thing to do.

### On-brand examples

- *"Open your closet, not another app."*
- *"You've worn the white tee 14 times this month. We're picking something else."*
- *"Three pieces, sulking since spring. Let's get them back out."*
- *"That dress has been waiting since November."*
- *"Your closet wants a word."*

### Off-brand examples

- ❌ *"Bestie, ready to slay your day?"* — try-hard
- ❌ *"It's giving morning saviour ✨"* — trend-chase
- ❌ *"At ReWear, we believe…"* — corporate
- ❌ *"STOP fast fashion. NOW."* — preachy
- ❌ *"Hey legend! Crush your style!"* — hustle

### Vocabulary rules

**Use:** specific item names, observational data, direct address ("you"), confident verbs (wear, swap, keep, skip, restyle).

**Avoid:** *passionate, mission, journey, conscious consumer, bestie, babe, slay, crush, level up, it's giving.*

**Emoji:** at most one, with purpose. Never as punctuation.

**English:** UK throughout (colour, behaviour, organise).

---

## 6. Imagery direction

The logo establishes the visual world: **textile + craft + refined**. Brand imagery should follow.

### What ReWear photography looks like

- Natural light, never studio strobe
- Soft shadows, mid-tone palette (linen, oat, sage, forest)
- Real wardrobes, not styled flatlays from the homepage of every other fashion site
- Hands, fabric textures, garments mid-fold
- Slight grain — not over-retouched
- Wide negative space — same restraint as the logo

### What it doesn't look like

- ❌ Aggressive eco-imagery (smokestacks, polluted oceans)
- ❌ Stock-photo "girl smiling at her closet"
- ❌ Influencer haul flatlays
- ❌ Fast-fashion product photography
- ❌ Heavy filter / Instagram preset look

### Reference clusters

- Cos / The Frankie Shop / Toogood — clean, textile-first
- Aimé Leon Dore — restrained editorial
- Pangaia — modern textile
- Sophie Silva (the brand voice reference) — her own Instagram aesthetic
- Bode brand — vintage textile + craft

---

## 7. File and asset structure

```
/Users/jgarcher/projects/rewear/
├── BRAND.md                          ← this document
├── PLAN.md                           ← multi-session execution plan
├── README.md                         ← project meta
├── assets/
│   ├── README.md                     ← asset roadmap and inventory
│   ├── logo/
│   │   └── rewear-logo-primary.png   ← THE LOGO (locked)
│   ├── imagery/                      ← brand photography (TBD)
│   └── fonts/                        ← font files if needed (Google Fonts otherwise)
└── decisions/
    ├── 001-positioning-angle.md
    ├── 002-brand-voice.md
    ├── 003-manifesto.md
    ├── 004-personas.md
    ├── 005-logo-direction.md
    ├── 006-logo-execution-brief.md
    ├── 007-colour-palette.md
    ├── 008-typography.md
    ├── 009-logo-secondary-brief.md   ← deferred
    └── 010-logo-final.md             ← this lock
```

When the marketing site (Session 5) and app (Session 6) are built, they live as sibling directories:

```
/Users/jgarcher/projects/rewear/
├── BRAND.md
├── ...
├── site/                             ← Next.js marketing site (Session 5)
└── app/                              ← Next.js + Supabase app (Session 6)
```

Both pull brand tokens from a shared package or constants file.

---

## 8. Brand health checklist

Before any output goes live, ask:

- [ ] Would Maya screenshot this — or roll her eyes?
- [ ] Does it sound like the older sister, not the influencer?
- [ ] Are the colours from the locked palette?
- [ ] Are the fonts Fraunces and Inter?
- [ ] Is the logo used correctly (primary mark, clear space, on-brand surface)?
- [ ] Is the eco mission *subtext* or *text*? (Should be subtext.)
- [ ] Is it UK English?
- [ ] Are there any emoji? Are they earned?

If any answer is wrong — fix before shipping.
