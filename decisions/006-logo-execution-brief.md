# ADR 006 — Logo execution brief (v2)

**Date:** 2026-04-29 · revised same day with multi-stitch refinement
**Status:** Brief ready for execution (designer or AI image gen)
**Source decisions:** ADR 005 (direction), 002 (voice), 001 (positioning)
**Revision note:** v1 used a single uniform stitch across the mark. **v2 introduces three different high-end embroidery techniques — one per arrow** — bringing back the "patchwork" idea Anna-Liv originally raised, but expressing it through *technique* rather than *fabric blocks*.

---

## The mark, in one sentence

A recycle symbol — three looping arrows — **embroidered onto natural cream linen**, where **each arrow uses a different high-end couture stitching technique**, rendered with visible thread, slight dimensional shadow, and the quiet confidence of a haute-couture sampler.

---

## Construction

### The recycle symbol itself

- Three arrows, each curving into the next, forming a **closed triangular loop** (Möbius-style is fine; classic 3-arrow is also fine — designer choice based on which embroiders cleaner)
- **Geometry:** clean, rounded ends on each arrow, consistent stroke width
- **Stroke weight:** medium — heavy enough that stitch detail reads, light enough that the symbol stays elegant
- The symbol should fit comfortably in a square — slightly wider than tall is fine

### The three stitches — one per arrow

The whole point of v2: each arrow uses a *different* couture / heritage stitching technique. The visual variety reads as patchwork-by-craft. All three sit in the same refined world (haute couture and visible-mending traditions). None are folksy.

| Arrow | Stitch | Tradition | Visual texture |
|---|---|---|---|
| 1 | **Sashiko running stitch** | Japanese visible mending — repair-as-art | Clean parallel dashed lines, geometric and quiet |
| 2 | **Tambour chain stitch** | Haute couture (Lesage atelier, used by Chanel & Dior) | Looped continuous chain, rope-like, decorative |
| 3 | **Satin stitch** | Classic couture filled-surface embroidery | Smooth solid fill, glossy, anchoring |

**Visual shorthand of each texture:**

```
Sashiko:   — — — — — —     (parallel dashed lines)
Chain:     ⊃⊂⊃⊂⊃⊂⊃⊂      (looped chain)
Satin:     ▌▌▌▌▌▌▌▌      (filled smooth)
```

### Why these three

- **Each is recognisably distinct** — variety reads at hero size
- **All three are high-end** — couture or refined heritage, never craft-fair
- **They tell a story together:** ancient repair (Sashiko) → couture craft (Tambour) → modern finishing (Satin) — three traditions converging in one symbol
- **At small sizes** (favicon, app icon ≤64px), the three textures blur into "embroidered recycle symbol on linen" — still works, just loses the technique detail. That's fine.
- **Sashiko especially** is on-mission: it's literally the visible-mending tradition, the original upcycling

### Common stitching rules (across all three arrows)

- **Thread weight:** visible at 256px, blurs gracefully at 64px
- **Thread colour:** **single colour — deep forest green** (`#2D6A47`) on cream linen ground. Resist the urge for multi-colour thread — it cheapens the mark.
- **Hand-done feel:** slight irregularity in stitch spacing — human, not machine
- **Dimensionality:** subtle shadow under the embroidery, as if it sits slightly proud of the fabric
- **No metallic, no beading, no sequins** — keep it textile, not jewelry

### The fabric ground

- Visible at full lockup size; recedes or disappears at small sizes
- **Material feel:** natural-fibre — linen, cotton, raw silk
- **Colour:** soft cream / off-white (`#F5F0E6` ballpark)
- **Texture:** subtle weave visible up close, not overdone
- For app icon variant, the fabric becomes a clean cream square; the mark is the hero

---

## Colour direction

Pending Session 2 colour-palette work, but starting position:

- **Mark colour:** deep forest green (close to current `#3B8C5A` but possibly darkened to `#2D6A47` for more refinement)
- **Thread / stitch colour:** warm cream (`#F5F0E6`) when the mark is on a green ground; deep green when the mark is on a cream ground
- **Fabric ground:** warm cream (`#F5F0E6`)

A subtle "negative" version exists — cream mark with green stitching on a green ground — for hero placements.

---

## Variants required

| Variant | Use | Notes |
|---|---|---|
| **Primary lockup** | Marketing site hero, press kit, About page | Mark + wordmark + tagline |
| **Mark only — full colour** | App icon, social avatar | Stitching detail still visible at 1024px and degrading gracefully to 64px |
| **Mark only — monochrome dark** | Dark backgrounds, embroidered merch | Cream/white mark on dark ground |
| **Mark only — monochrome light** | Light backgrounds, print | Forest-green mark on cream ground |
| **Wordmark only** | Marketing footer, secondary placements | "ReWear" only, in the chosen typeface |
| **Favicon** | Browser tab | 32×32 simplified — stitching probably drops out, just the silhouette |

---

## Wordmark — "ReWear"

- **Capitalisation:** *ReWear* — capital R, capital W, lowercase rest. Not REWEAR, not rewear.
- **Typeface:** to be picked in the typography step (this session) — leaning towards a humanist serif or refined sans
- **Tracking:** slightly tight, confident
- **Tagline lockup:** *Wear More. Waste Less.* — set below the wordmark in a smaller weight, generous spacing

---

## Don'ts

- ❌ No leaf, plant, sprout, or earth motifs
- ❌ No green-and-white-stripes-on-arrow ("recycling-bin" energy)
- ❌ No earth-day pastel
- ❌ No cursive / script type
- ❌ No gradient
- ❌ No 3D perspective or photographic embroidery — this is a *stylised* embroidered mark, not a photograph of one
- ❌ No emoji-friendly cartoon style
- ❌ Don't use the standard Möbius-recycle symbol unmodified — this needs to feel made for ReWear, not generic

---

## Reference cluster

For the designer — or for the AI prompt — these are the moods we're triangulating between:

- **Aspinal of London** — embossed monogram refinement
- **Mansur Gavriel** — restrained minimalism
- **Loewe craftsmanship campaigns** — visible craft as luxury signal
- **Pangaia tags** — textile-meets-modern
- **Vintage tailor's labels** — the embroidery aesthetic
- **Rixo embroidered details** — thread on fabric, refined

Anti-references: Greenpeace, Earthbound, Whole Foods, anything WWF-adjacent, anything that screams "eco non-profit."

---

## How we'll execute

**Recommended path: AI concept first, then designer refinement.**

1. **AI image gen pass** (cost: minimal, time: ~30 min)
   - Use this brief as the prompt
   - Generate 8–12 concept variations
   - Pick the 2 strongest
2. **Vectorise** the chosen concept
3. **Designer pass** (~£200–500, time: 2–3 days)
   - Refine the geometry and stitch detail
   - Build out the full variant set
   - Deliver SVG + PNG + brand guidelines page
4. **If AI output is strong enough** to use as-is, skip step 3 for v1 — revisit when budget allows.

---

## AI prompt translation (v2 — multi-stitch)

### Primary prompt

> A minimal embroidered logo of a recycle symbol — three looping arrows forming a closed triangle — embroidered onto natural cream linen fabric. **Each of the three arrows is rendered in a different high-end embroidery technique:** the first arrow in Sashiko parallel running stitches (Japanese visible-mending tradition, clean dashed lines), the second arrow in tambour chain stitch (haute-couture looped chain, rope-like texture), the third arrow in satin stitch (smooth filled couture surface). All three stitched in deep forest-green thread (#2D6A47) on cream linen. Subtle hand-done irregularity, slight thread shadow giving dimensional feel — as if the embroidery sits proud of the fabric. Refined, premium, like a haute-couture house's sampler card. Centred composition, square format, soft natural lighting, no text, no other elements. Style: Lesage atelier sampler, Sashiko visible mending, Hermès embroidered detail, Chanel haute-couture finishing.

### Negative prompt

> cartoon, 3D, gradient, leaf, earth, pastel, busy, multiple thread colours, metallic thread, sequins, beads, plastic, clipart, generic recycling bin, machine-stitched feel, folksy, craft fair, hippie, rustic, child-like.

### Backup prompt (if model doesn't recognise stitch names)

> A minimal embroidered logo of a recycle symbol — three looping arrows on cream linen. Each arrow has a different visible stitch texture: arrow one is small parallel dashed running stitches; arrow two is a continuous looped chain texture; arrow three is a smooth filled embroidered surface. All in deep forest-green thread on natural cream linen. Hand-embroidered, subtle dimensional shadow, refined haute-couture sampler feel. Square composition, centred, no text.

### Test in this order

1. Try the **Primary prompt** in your preferred image gen (Midjourney v6, Imagen, Flux 1.1 Pro, ChatGPT/DALL·E)
2. If the model produces something off (mixes the stitches randomly, or ignores them), fall back to the **Backup prompt**
3. Generate 8–12 variations
4. Bring 3–6 favourites to next session
