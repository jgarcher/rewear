# ADR 007 — Colour Palette

**Date:** 2026-04-29
**Status:** Locked v1
**Decided by:** Anna-Liv (delegated to recommendation), Session 2

This is the full design token system for ReWear. Drop directly into Tailwind config / CSS variables when we build the marketing site (Session 5) and app (Session 6).

---

## The five base colours

| Token | Hex | Name | Use |
|---|---|---|---|
| `--rw-forest` | `#2D6A47` | Forest | Primary brand colour. Logo, primary buttons, brand accents |
| `--rw-linen` | `#F5F0E6` | Linen | Page background, card surfaces, "fabric" ground |
| `--rw-charcoal` | `#1A1A1A` | Charcoal | Body text, headlines |
| `--rw-clay` | `#C2876B` | Clay | Warm accent — donation CTAs, low-wear-count flags, highlights |
| `--rw-sage` | `#7A8B6C` | Sage | Secondary accent — secondary buttons, subtle states |

---

## Full token system

### Forest variants

| Token | Hex | Use |
|---|---|---|
| `--rw-forest-50` | `#EAF1ED` | Lightest tint — selected backgrounds, highlight rows |
| `--rw-forest-100` | `#C9DFD3` | Hover background for forest items |
| `--rw-forest-500` | `#2D6A47` | Brand primary (default) |
| `--rw-forest-600` | `#235437` | Hover state for primary buttons |
| `--rw-forest-700` | `#1A4029` | Pressed state, deep accents |
| `--rw-forest-900` | `#0F2818` | Almost-black-green for very deep contrast |

### Linen variants

| Token | Hex | Use |
|---|---|---|
| `--rw-linen-50` | `#FBF8F2` | Lightest — modal backdrops, card surfaces |
| `--rw-linen-100` | `#F5F0E6` | Page background (default) |
| `--rw-linen-200` | `#EDE6D6` | Card backgrounds, dividers, subtle stripes |
| `--rw-linen-300` | `#DFD5BF` | Borders, hover for linen surfaces |

### Text colours

| Token | Hex | Use |
|---|---|---|
| `--rw-text-primary` | `#1A1A1A` | Body text, headlines |
| `--rw-text-secondary` | `#4A4A4A` | Subheadings, supporting text |
| `--rw-text-muted` | `#7A7A7A` | Metadata, timestamps, labels |
| `--rw-text-placeholder` | `#A8A8A8` | Empty state hints, placeholder |
| `--rw-text-on-forest` | `#F5F0E6` | Text on forest backgrounds (use linen, not pure white) |

### Accent — Clay (warm)

| Token | Hex | Use |
|---|---|---|
| `--rw-clay-100` | `#F2DDD2` | Soft clay backgrounds |
| `--rw-clay-500` | `#C2876B` | Default — donation CTAs, low-wear flags |
| `--rw-clay-600` | `#A66E54` | Hover |

### Accent — Sage (cool)

| Token | Hex | Use |
|---|---|---|
| `--rw-sage-100` | `#E2E7DD` | Soft sage backgrounds |
| `--rw-sage-500` | `#7A8B6C` | Default — secondary buttons, subtle states |
| `--rw-sage-600` | `#637353` | Hover |

### Semantic

| Token | Hex | Use |
|---|---|---|
| `--rw-success` | `#2D6A47` | Reuse forest — success implies the brand mission |
| `--rw-warning` | `#C2876B` | Reuse clay |
| `--rw-error` | `#9B3636` | Muted brick red — never bright/alarming |
| `--rw-info` | `#3D5A6C` | Muted slate blue — rarely used |

### Borders & dividers

| Token | Hex | Use |
|---|---|---|
| `--rw-border-subtle` | `#EDE6D6` | Card edges, table rows |
| `--rw-border-default` | `#DFD5BF` | Inputs, separators |
| `--rw-border-strong` | `#1A1A1A` | Selected states |

---

## Usage rules

- **Default page:** linen-100 background, charcoal text, forest-500 for primary actions
- **Cards / surfaces:** linen-50 with linen-300 border
- **Primary button:** forest-500 background, linen-100 text
- **Secondary button:** linen-100 background, forest-500 text, forest-500 border
- **Donation / charity CTA:** clay-500 background — visually distinct from primary
- **Resell / sell action:** sage-500 background — secondary to forest, signals action
- **Wear-count "loved" (high):** forest-500 text
- **Wear-count "neglected" (low):** clay-500 text — gently flags items not worn
- **Streak indicator:** forest-500 with linen background

---

## Dark mode

**Defer to v2.** Will follow same token structure with inverted relationships. Logged for later.

---

## What we deliberately did *not* pick

- Bright eco-green (Whole Foods territory)
- Pastel earthy (crunchy hippie)
- Pure white background (too app-store generic)
- Pure black text (too harsh against linen)
- Bright safety-orange or red accents (alarming, off-brand)
