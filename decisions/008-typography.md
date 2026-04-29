# ADR 008 — Typography & Iconography

**Date:** 2026-04-29
**Status:** Locked v1
**Decided by:** Anna-Liv (delegated to recommendation), Session 2

## Decisions

### Headlines: **Fraunces** *(Google Fonts, free)*
- Modern serif with optical sizes — elegant at hero, friendly at smaller sizes
- Slight personality, refined, pairs with embroidery / textile aesthetic
- Use weights: 400 / 500 / 600
- Hero / display: Fraunces 600, slightly tighter tracking
- Section headings: Fraunces 500
- Soft-grade variant for friendlier moods

### Body / UI: **Inter** *(Google Fonts, free)*
- Most readable sans-serif on the web
- Neutral — lets headlines and writing carry the personality
- Use weights: 400 / 500 / 600
- Body: Inter 400, line-height 1.55–1.65
- UI / labels: Inter 500
- Buttons: Inter 600

### Icons: **Phosphor Icons** *(free, MIT)*
- Line style, regular weight (1.5pt stroke)
- Slightly softer corners than Lucide — pairs with embroidered curves
- Default colour: `--rw-charcoal`; active: `--rw-forest-500`

## Type scale (Tailwind-ready)

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

## Pairing rules

- **Always:** Fraunces for headlines and quotes, Inter for everything else
- **Never:** Mix serif and sans within a single sentence
- **Tagline ("Wear More. Waste Less."):** Fraunces 600, all weight on the typography, no decoration
