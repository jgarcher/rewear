# ReWear — Asset Inventory & Roadmap

**Last updated:** 2026-04-29

---

## What's locked today

### `logo/rewear-logo-primary.png`
The hero mark. Primary embroidered logo on linen — Sashiko / satin / tambour stitches. Use everywhere space and resolution allow. Source: generated via image gen, ADR 006 v2 prompt.

---

## Variants still needed

These can be generated async by Anna-Liv with image gen, or commissioned from a designer. Each row includes the prompt to use.

### 1. `logo/rewear-logo-mark-transparent.png`
**Purpose:** App icon, social avatar, dark surfaces — anywhere we need the mark without the linen ground.
**Specs:** 1024×1024px, transparent background, just the three embroidered arrows.

**Prompt:**
> Three embroidered recycle arrows on a transparent background. Each arrow uses a different stitch: Sashiko parallel running stitches (top), satin stitch smooth fill (bottom-left), tambour chain stitch (bottom-right). Deep forest-green thread (#2D6A47). No fabric ground, no background, just the embroidered arrows isolated. Square composition.

### 2. `logo/rewear-logo-monochrome-cream.png`
**Purpose:** Dark backgrounds (forest, charcoal). The same mark in cream/off-white thread, with the linen ground replaced by deep forest green.
**Specs:** 1024×1024px.

**Prompt:**
> A minimal embroidered logo of a recycle symbol — three looping arrows — embroidered in cream/off-white thread (#F5F0E6) onto deep forest-green linen fabric (#2D6A47). Each arrow uses a different stitch: Sashiko running stitch (top), satin stitch (bottom-left), tambour chain stitch (bottom-right). Subtle thread shadow, hand-done feel. Square composition, centred, no text.

### 3. `logo/rewear-wordmark.svg` (or .png)
**Purpose:** Wordmark for footer, secondary placements, and the lockup.
**Specs:** "ReWear" set in **Fraunces 600**, charcoal (#1A1A1A) on transparent. Generate cleanly via design tool — not image gen.

How to produce:
- Open Figma / Canva / any design tool
- Set text "ReWear" in Fraunces 600
- Slightly tighter tracking (-1.5%)
- Export as SVG (preferred) and PNG @2x

### 4. `logo/rewear-lockup-primary.png`
**Purpose:** Marketing hero, press kit, About page, business card.
**Specs:** Mark + wordmark + tagline composition.

**Layout:**
```
   [embroidered mark]
       ReWear
  Wear More. Waste Less.
```

Mark: 240px tall
Wordmark: Fraunces 600, ~64px
Tagline: Fraunces 500, ~24px, generous letter-spacing
Vertical spacing: 24px between mark/wordmark, 12px between wordmark/tagline

### 5. `logo/favicon.png` and `favicon.ico`
**Purpose:** Browser tabs.
**Specs:** 32×32px, simplified.

At 32px the stitch detail blurs into noise. The favicon should be a **clean silhouette** of the recycle symbol in forest green on linen. Generate via design tool, not image gen.

### 6. `logo/app-icon-1024.png`
**Purpose:** iOS / Android app icon.
**Specs:** 1024×1024px, full-bleed background. Use the primary mark, but composed with the linen ground filling the full square (no white margins).

---

## Imagery directory (`imagery/`)

To be filled in Session 5 (marketing site) and onwards. Will include:

- Hero photography (real wardrobes, not stock)
- Section break textiles (linen, raw-edge fabric details)
- Reference moodboard images
- Brand-aligned stock or commissioned photography

---

## Fonts directory (`fonts/`)

Currently empty. **Fraunces** and **Inter** are loaded from Google Fonts directly in HTML/CSS — no local files needed unless we go offline-first.

If we ever need local files: download from Google Fonts → place WOFF2 here → reference in CSS `@font-face`.

---

## Source files we don't have yet

- `.svg` of the logo — needed for clean scaling. Generate by tracing the PNG in Illustrator / vectorising via [vectorizer.io](https://vectorizer.io) once we have one we love.
- `.psd` or `.ai` source — only needed if we hire a designer to refine.

---

## Quality bar

Before any logo asset is added to this folder, it must pass:

- [ ] Visible stitch variety across the three arrows (Sashiko / satin / tambour)
- [ ] Forest-green thread, single colour (no rainbow)
- [ ] Linen ground texture visible (where applicable)
- [ ] No text, no other elements
- [ ] No "recycling-bin" generic look
- [ ] Square or near-square composition for the mark
- [ ] Hand-done feel — slight irregularity, dimensional shadow
