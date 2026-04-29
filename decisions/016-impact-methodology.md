# ADR 016 — Impact methodology

**Date:** 2026-04-29
**Status:** Locked v1
**Decided in:** Session 4
**Why this matters most:** The home screen will say *"~640 L water saved · ~12 kg CO₂ avoided"*. If those numbers aren't defendable, the brand loses credibility the first time anyone asks *"how do you know?"* This doc locks the maths and the sources.

---

## Guiding principles

1. **Conservative over impressive.** We'd rather under-claim than over-claim. Numbers should withstand challenge.
2. **Always frame as "delayed", never "saved".** Garments eventually get replaced; we're slowing the cycle, not eliminating it.
3. **Always source.** Every number on the UI links to a transparent methodology page (`/methodology`) listing primary sources.
4. **Show ranges where appropriate.** *"~600–800 L water"* is more honest than *"640 L"*.
5. **Default to the citing institution, not the secondary blog.** WRAP UK > "ten ways to be sustainable" listicle.

---

## The headline metrics on Maya's home screen

| Metric | Calculation | Conservative bound |
|---|---|---|
| **Re-wears this year** | Count from `wear_log` | 1:1 — undeniable |
| **Garments delayed** | `re-wears / 20` | 1 garment delayed per 20 re-wears |
| **Water delayed** | `garments_delayed × 3,000 L` | Per garment weighted average (see below) |
| **CO₂ delayed** | `garments_delayed × 10 kg` | Per garment weighted average |
| **Streak** | Days in a row with at least one outfit logged | Behavioural, not impact — undeniable |

---

## The "20 re-wears = 1 delayed garment" heuristic

This is the load-bearing assumption. Where it comes from:

- WRAP UK reports the average UK person buys ~26 garments/year and the average garment is worn ~7-10 times before discard (Ellen MacArthur Foundation, *A New Textiles Economy*, 2017).
- Re-wearing existing garments doesn't *eliminate* future purchases — it *delays* them.
- A reasonable conservative estimate: every ~20 additional wears of existing wardrobe items delays one new garment purchase.

This is a **deliberately cautious** heuristic. It would be easy to claim "every 7 re-wears = 1 garment saved" and produce more impressive numbers — but it's not defensible. Stick with 20.

If a journalist or sceptical user asks: *"Where does the 20 come from?"* — we say:

> *"It's a conservative estimate based on UK consumer research from WRAP UK and the Ellen MacArthur Foundation. We chose the cautious end of the range so the numbers stand up to challenge."*

---

## The "per delayed garment" weighted averages

A garment's lifecycle footprint varies massively by fibre, country of manufacture, and end-of-life. We use weighted averages reflecting Maya's likely wardrobe mix.

### Per-garment impact estimates (weighted, conservative)

| Garment type | Water (L) | CO₂ (kg) | Source |
|---|---|---|---|
| Cotton t-shirt | 2,700 | 5 | WRAP UK / WWF |
| Cotton trousers (jeans) | 7,500 | 10 | Levi's published LCA |
| Wool jumper | 700 | 28 | Higg MSI |
| Synthetic puffer | 100 | 12 | Higg MSI |
| Linen dress | 6,500 | 4 | Higg MSI / European Linen Industry |
| Leather shoes | 17,000 | 14 | Higg MSI |

### Weighted average across mixed wardrobe

Based on Maya's seed wardrobe of 30 items:
- 5 tops + 5 t-shirts (33%) — mostly cotton/wool
- 5 bottoms (17%) — cotton denim heavy
- 5 dresses (17%) — mixed fibres
- 5 coats (17%) — wool + recycled synthetic
- 5 shoes (17%) — leather

Weighted means per delayed garment:
- **Water:** ~3,000 L
- **CO₂:** ~10 kg
- **Waste:** ~0.4 kg (textile)

These are the values we use in the home-screen calculation. Round numbers because precision is dishonest at this granularity.

---

## What the home screen actually displays

```
This year:
  47 re-wears
  ~ 2 garments delayed
  ~ 7,000 L water · ~ 24 kg CO₂

(based on WRAP UK methodology — see how)
```

Note:
- We display *"~"* always. No number is precise.
- We anchor to *re-wears* (the undeniable count) before the derived metrics.
- The "see how" link goes to `/methodology` (full transparency page).
- We round generously: 47 × (1/20) = 2.35 → "~ 2 delayed".

---

## The transparency page (`/methodology`)

This page is shipped with the marketing site and the app. It's static, accessible from every metric tooltip.

Content outline:

1. **The TL;DR** — "Re-wearing extends garment life. We use conservative industry data to estimate the resulting environmental savings. Here's the maths."
2. **The heuristic** — "Every ~20 re-wears delays roughly one new garment purchase."
3. **Per-garment averages** — table above, with sources cited inline.
4. **What we deliberately don't claim** — "We never claim impact eliminated. Garments eventually get replaced. We're slowing the cycle, not stopping it."
5. **What's in our methodology vs. what's not** — e.g., we don't account for transport, packaging, dry-cleaning emissions. Future versions may.
6. **Primary sources** with links:
   - WRAP UK *Valuing Our Clothes* (2017)
   - WRAP UK *Textiles 2030* (ongoing)
   - Ellen MacArthur Foundation *A New Textiles Economy* (2017)
   - Higg MSI v3 (2023) — Sustainable Apparel Coalition
   - UNECE / Quantis *Measuring Fashion* (2018)
   - Levi Strauss *Lifecycle Assessment of Levi's 501* (2015)

---

## What we'll need to defend

Likely questions and our answers:

**Q: "Why 20 re-wears = 1 garment delayed?"**
A: Conservative estimate based on UK consumer purchase volume (~26 garments/yr) and average wear count before discard (~7-10 wears, EMF). The 20:1 ratio errs on the side of caution.

**Q: "Why use Higg MSI when activists criticise it?"**
A: Higg MSI is the most widely-used industry standard. We cross-reference with WRAP UK and Levi's published data. We're aware of critiques. Where Higg differs from peer-reviewed academic LCAs, we use the higher (more conservative) impact figure.

**Q: "Aren't synthetic clothes lower-water than cotton?"**
A: Yes — and we account for that in the weighted average. Synthetic puffers have ~100 L water vs. cotton's 2,700 L. We don't pretend cotton is always better; we use the realistic mix.

**Q: "What about microplastics?"**
A: Not currently in our calculation — they're hard to quantify per-wear. We mention them in the Did You Know feed and the methodology page. Future work.

**Q: "Why don't you show energy / land use?"**
A: For V1 we're keeping it to water + CO₂ — the two metrics consumers most readily understand. Higg MSI tracks 8 dimensions; the others are deferred.

---

## Implementation note for Session 7 (impact tracker build)

```typescript
function calculateImpact(rewearsCount: number) {
  const REWEARS_PER_DELAYED_GARMENT = 20;  // ADR 016 conservative heuristic
  const WATER_L_PER_GARMENT = 3000;         // weighted avg, ADR 016
  const CO2_KG_PER_GARMENT = 10;
  const WASTE_KG_PER_GARMENT = 0.4;

  const garmentsDelayed = rewearsCount / REWEARS_PER_DELAYED_GARMENT;
  return {
    rewears: rewearsCount,
    garments_delayed: Math.round(garmentsDelayed * 10) / 10,  // 1 dp
    water_litres: Math.round(garmentsDelayed * WATER_L_PER_GARMENT / 100) * 100,  // round to 100s
    co2_kg: Math.round(garmentsDelayed * CO2_KG_PER_GARMENT),
    waste_kg: Math.round(garmentsDelayed * WASTE_KG_PER_GARMENT * 10) / 10
  };
}
```

Always display rounded, always with `~` prefix in UI, always with source attribution.
