# ADR 015 — Clothing taxonomy & controlled vocabulary

**Date:** 2026-04-29
**Status:** Locked v1
**Decided in:** Session 4
**Purpose:** Single source of truth for category labels, colours, materials, seasons, and occasions. Used by the data model (ADR 012), AI prompts (ADR 014), and the UI (ADR 013). When in doubt, this doc wins.

---

## Why a controlled vocabulary

If the user types "tee", "t-shirt", and "T shirt" we end up with three separate filter buckets. The Auto-tag AI also benefits from a fixed vocabulary — its outputs become validatable. Free-text fields are kept where richness is genuinely useful (notes, brand) but everything filterable is enum.

---

## 1. Categories (top-level, enum)

| Value | Display | Notes |
|---|---|---|
| `top` | Tops | Shirts, blouses, jumpers, knits, vests, tank tops |
| `tshirt` | T-shirts | Separate from `top` because of high volume / different filtering |
| `bottom` | Bottoms | Jeans, trousers, skirts, shorts |
| `dress` | Dresses | Includes jumpsuits |
| `coat` | Outerwear | Coats, jackets, blazers, puffers |
| `shoes` | Shoes | All footwear |
| `accessory` | Accessories | Bags, scarves, belts, hats — **not in V1**, deferred to V2 |

V1 ships with the first 6 categories. Accessory is in the schema but hidden from UI.

## 2. Subcategories (per category — suggested, not enforced)

Shown as a typeahead suggestion list when user adds a custom subcategory. Not enforced — they can type anything.

### Top
- camisole, blouse, shirt, knit jumper, hoodie, sweatshirt, tank, vest, cardigan, polo, turtleneck

### T-shirt
- crew tee, v-neck tee, long-sleeve tee, graphic tee, fitted tee, oversized tee

### Bottom
- jeans, trousers, chinos, shorts, leggings, midi skirt, maxi skirt, mini skirt, culottes, joggers

### Dress
- midi dress, maxi dress, mini dress, slip dress, knit dress, sundress, shirt dress, jumpsuit

### Coat
- overcoat, trench, puffer, parka, raincoat, blazer, denim jacket, leather jacket, chore coat, cardigan-coat

### Shoes
- trainers, boots, ankle boots, loafers, heels, ballet flats, sandals, mules, slippers

## 3. Colour palette (controlled, enum)

Limited to a curated set of plain-English colours. The Auto-tag AI is instructed to map any input to this vocabulary.

| Value | Hex (visual swatch only — NOT brand colour) |
|---|---|
| `black` | `#1A1A1A` |
| `charcoal` | `#3A3A3A` |
| `grey` | `#9A9A9A` |
| `white` | `#FFFFFF` |
| `cream` | `#F5F0E6` |
| `ivory` | `#FBF8F0` |
| `beige` | `#D9C9A8` |
| `tan` | `#C19A6B` |
| `brown` | `#7A5536` |
| `camel` | `#C49E6A` |
| `forest green` | `#2D6A47` |
| `sage` | `#7A8B6C` |
| `olive` | `#6B7A2E` |
| `navy` | `#1F2E55` |
| `mid blue` | `#4A6F9C` |
| `dark indigo` | `#2C3E5C` |
| `light blue` | `#A8C4DD` |
| `red` | `#9B3636` |
| `clay` | `#C2876B` |
| `pink` | `#D8A4A4` |
| `lilac` | `#B7A4D8` |
| `purple` | `#5C3F7A` |
| `yellow` | `#D4B65C` |
| `mustard` | `#A88A2C` |
| `mint` | `#A6D6BD` |
| `multicolour` | n/a — used for prints/florals |

**For patterns** (florals, stripes, plaid): set `primary_colour` to the dominant colour and `secondary_colour` to the next one.

## 4. Materials (suggested, free text allowed)

Suggested list for the dropdown:

- cotton, organic cotton, linen, hemp, bamboo
- wool, merino wool, cashmere, alpaca, mohair
- silk, satin
- polyester, recycled polyester, nylon, acrylic, viscose
- cotton denim, raw denim
- leather, vegan leather, suede
- mixed / blend
- unknown

Free text allowed for unusual cases (e.g., "tencel", "modal", "linen-cotton blend"). Auto-tag AI maps to the suggested list when confidence is high.

## 5. Seasons (multi-select enum)

| Value | Display | Notes |
|---|---|---|
| `winter` | Winter | Cold-weather garments |
| `spring` | Spring | Transitional, light layers |
| `summer` | Summer | Warm-weather, light fabrics |
| `autumn` | Autumn | Transitional, layered |
| `all` | All-season | Year-round basics — set this OR specific seasons, not both |

Most items will have 2-3 seasons. The AI defaults to a sensible set based on category and material.

## 6. Occasions (multi-select enum)

| Value | Display | Notes |
|---|---|---|
| `casual` | Casual | Everyday, errands, weekends |
| `work` | Work | Office, smart, professional |
| `evening` | Evening | Going out, dinners, drinks |
| `athletic` | Athletic | Gym, running, sports |
| `special` | Special | Weddings, formal events |

Most items have 1-2 occasions. The AI errs on the side of including `casual` for ambiguous items.

## 7. Conditions (enum)

| Value | Display | Visible to user as |
|---|---|---|
| `new` | New | "New" — never worn |
| `like-new` | Like new | "Like new" — worn 1-3 times |
| `good` | Good | "Good condition" — default |
| `worn-in` | Worn-in | "Worn in" — visible signs of wear, still wearable |
| `needs-mending` | Needs mending | "Needs mending" — flagged for repair |

When `condition = needs-mending`, the AI Outfit Generator deprioritises the item and the UI surfaces a "Restyle / repair" prompt.

## 8. Acquired source (enum)

| Value | Display |
|---|---|
| `new` | Bought new |
| `sale` | Bought on sale |
| `vinted` | Vinted |
| `depop` | Depop |
| `charity-shop` | Charity shop |
| `gift` | Gift |
| `hand-me-down` | Hand-me-down |
| `swap` | Swap |
| `unknown` | Unknown |

Used for: estimating resale price, computing impact (re-used items have lower acquisition footprint), and storytelling on the item detail screen.

## 9. Status (enum, item lifecycle)

| Value | Display |
|---|---|
| `active` | In wardrobe |
| `listed` | Listed for sale |
| `donated` | Donated |
| `upcycled` | Upcycled |
| `retired` | Retired (worn out) |

A garment moves through this lifecycle. We never delete — historical wear data stays for streak / impact tracking.

---

## How the AI uses this

The Auto-tag prompt (ADR 014) includes this taxonomy as part of its system message. When the user uploads a photo of a "knit jumper in mossy green", the AI knows to map:
- Category → `top`
- Subcategory → `knit jumper`
- Primary colour → `sage` (mapped from "mossy green")
- Material guess → `wool` (medium confidence — visible from texture)
- Seasons → `[autumn, winter, spring]`
- Occasions → `[casual, work]`

When in doubt, the AI returns `null` for material and `medium`/`low` confidence — the UI flags those for user review.
