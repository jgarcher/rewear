# ADR 014 — AI Behaviour Specs (V1)

**Date:** 2026-04-29
**Status:** Locked v1
**Decided in:** Session 3
**Scope:** Full input/output/prompt/failure-mode specs for the two V1 AI features.

V1 ships **two** AI features (per ADR 011):
1. **Outfit Generator** — the wow feature, daily-use
2. **Auto-tag on upload** — the onboarding magic

V2 will add Image Gen for upcycle visualisations and Upcycling Coach (conversational). Specs for those land in their respective build sessions.

---

## Voice rule for all AI

Every AI prompt includes this fragment as part of the system message:

> **Speak as ReWear: a quietly confident, observational older-sister voice. Use the user's wardrobe data to be specific. Never preach about sustainability — let the data speak. Short sentences. No emoji unless purposeful. No hustle slang. No corporate-eco phrases. UK English.**

Reference: ADR 002.

---

## Model selection

| Feature | Model | Reasoning |
|---|---|---|
| Outfit Generator | `claude-sonnet-4-6` | Reasoning quality matters; not vision-heavy |
| Auto-tag | `claude-sonnet-4-6` (with vision) | Vision-capable, accurate categorisation |

**Why not Haiku:** Outfit reasoning needs context-sensitivity (matching colour, formality, weather) that benefits from Sonnet's stronger reasoning. We'll measure cost-per-call after launch and downgrade if Haiku is good enough.

**Prompt caching** — wardrobe context is reused across many calls, so we cache it. Cost savings ~75% on repeat calls.

---

# Feature 1 — Outfit Generator

## Purpose

Suggest a complete outfit from the user's wardrobe, contextual to weather and occasion, prioritising underworn items, avoiding recently-worn items, and matching the brand voice.

## Triggered from

- `/outfit` (user input form)
- Home screen (auto-fires once a day on first load → "Today's outfit")

## Inputs

### From the user

```typescript
{
  occasion: 'school' | 'work' | 'going-out' | 'errands' | 'special' | 'just-home',
  vibe: 'cosy' | 'sharp' | 'easy' | 'dressed-up' | 'surprise' | null,
  weather_override?: { temp_c: number, condition: string }
}
```

### From the system

```typescript
{
  user: {
    display_name: string,
    location_city: string  // for weather
  },
  weather: {
    temp_c: number,
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snow' | 'wind',
    forecast_summary: string
  },
  wardrobe: WardrobeItem[],         // all active items
  recent_wears: WearLog[],          // last 30 days
  recent_outfits: Outfit[]           // last 14 days, to avoid repeating
}
```

## Algorithm (deterministic pre-filter, then AI compose)

The AI doesn't pick from the entire wardrobe blind. We pre-filter, then ask the AI to compose from the eligible set. This makes outputs reliable, cheaper, and faster.

### Step 1 — Filter by season

Keep items where `seasons` includes the current season **or** `'all'`.

Current season derived from `weather.temp_c`:
- temp ≤ 8°C → winter
- 8 < temp ≤ 16°C → autumn / spring
- 16 < temp ≤ 22°C → spring / summer
- temp > 22°C → summer

### Step 2 — Filter by occasion

Keep items where `occasions` includes the selected occasion. Add fallback rules:
- `'school'` → also include `casual`
- `'work'` → also include `smart-casual` if exists
- `'just-home'` → all items eligible

### Step 3 — Score each item

Each remaining item gets a score:

```
score = base_priority + underworn_bonus - recent_penalty + condition_bonus
```

Where:
- `base_priority` = 1.0
- `underworn_bonus`:
  - +2.0 if `last_worn_date > 60 days ago`
  - +1.0 if `last_worn_date > 30 days ago`
  - +0.5 if `wear_count < 3` and acquired > 3 months ago
- `recent_penalty`:
  - -3.0 if worn in last 3 days
  - -1.5 if worn in last 7 days
  - -0.5 if part of an outfit suggested in last 14 days
- `condition_bonus`:
  - +0.5 if condition is `good` or `like-new`
  - -0.5 if condition is `worn-in`
  - -2.0 if condition is `needs-mending`

### Step 4 — AI composes from top candidates

Pass the top ~25 items (by score) to Claude with the prompt below. Claude composes a coherent outfit and writes the reasoning.

## Output schema (structured JSON)

```typescript
{
  outfit: {
    items: [
      { item_id: string, role: 'top' | 'bottom' | 'dress' | 'coat' | 'shoes' | 'accessory' }
    ],
    reasoning: string,           // voice-y, 1-3 sentences
    weather_note: string | null, // optional, e.g. "and the chore coat for the rain"
    confidence: 'high' | 'medium' | 'low'
  } | null,
  fallback_message?: string      // if AI couldn't compose, explain why
}
```

## Prompt template

### System message

```
You are the AI behind ReWear, a wardrobe app.

Speak as ReWear: a quietly confident, observational older-sister voice. Use the user's wardrobe data to be specific. Never preach about sustainability — let the data speak. Short sentences. No emoji. No hustle slang. No corporate-eco phrases. UK English.

Your job: pick a complete outfit from the user's wardrobe for the context given. Always include items by their item_id. Compose with care for: colour harmony, weather appropriateness, occasion-fit, and bringing forgotten pieces back into rotation.

Rules:
- Always include exactly one set: either {top + bottom + shoes} OR {dress + shoes}
- Add a coat if temperature ≤ 16°C OR condition is 'rainy'/'snow'/'wind'
- Optional accessory if it adds something
- Prefer items the user hasn't worn lately — but don't sacrifice the outfit for it
- Don't combine 4+ different bright colours; aim for 2-3 colours max
- The reasoning should be 1-3 sentences. Specific. Observational. Reference the data.
- If you can't compose a coherent outfit, return {outfit: null, fallback_message: "..."}

Output ONLY valid JSON matching this schema:
{
  "outfit": {
    "items": [{"item_id": "...", "role": "..."}],
    "reasoning": "...",
    "weather_note": "..." | null,
    "confidence": "high" | "medium" | "low"
  } | null,
  "fallback_message": "..." (only if outfit is null)
}
```

### User message

```
Maya needs an outfit for: {occasion} ({vibe})

Weather right now: {temp_c}°C, {condition}

Avoid items worn in the last 14 days (listed below).

Eligible wardrobe (top 25 candidates by score):
{wardrobe_subset_json}

Recent outfits (avoid repeating):
{recent_outfits_summary}
```

### Example output

```json
{
  "outfit": {
    "items": [
      { "item_id": "item-002", "role": "top" },
      { "item_id": "item-006", "role": "bottom" },
      { "item_id": "item-026", "role": "shoes" },
      { "item_id": "item-024", "role": "coat" }
    ],
    "reasoning": "The forest merino, vintage 501s, white Vejas. The merino's been quiet since Tuesday.",
    "weather_note": "Chore coat for the rain.",
    "confidence": "high"
  }
}
```

## Failure modes

| Trigger | Behaviour |
|---|---|
| Wardrobe < 5 items after filtering | Skip AI call. Return `{outfit: null, fallback_message: "Add a few more pieces and we'll start building outfits."}` |
| AI returns invalid JSON | Retry once with stricter prompt; if still fails, return generic fallback |
| AI returns items not in wardrobe (hallucinations) | Validate item_ids against database; drop invalid; if outfit becomes incomplete, return fallback |
| All items in last-14-day exclusion zone | Pass with `temperature: 1.0` and relaxed exclusion to encourage variety |
| User has no occasion-eligible items | Return `{outfit: null, fallback_message: "Nothing in your wardrobe quite fits 'going-out'. Try a different occasion?"}` |

## Performance targets

- p50 latency: <2.5s end-to-end (including weather fetch)
- p95 latency: <5s
- Cost: target <£0.005 per generation (with prompt caching on wardrobe context)

---

# Feature 2 — Auto-tag on upload

## Purpose

When the user uploads a photo of a clothing item, identify and pre-fill all wardrobe metadata. Goal: reduce add-an-item friction from "fill 8 fields" to "confirm what we got."

## Triggered from

- `/wardrobe/add` (Step 2 — Auto-tag review)

## Inputs

### From the user

```typescript
{
  photo: File  // JPEG / PNG, max 10MB, max 4096px on long edge
}
```

(The system uploads the photo to Supabase storage first, then passes a public URL to Claude.)

## Output schema (structured JSON)

```typescript
{
  recognised: boolean,
  fields: {
    category:       { value: ItemCategory, confidence: 'high' | 'medium' | 'low' },
    subcategory:    { value: string, confidence },
    primary_colour: { value: string, confidence },
    secondary_colour: { value: string | null, confidence },
    material_guess: { value: string | null, confidence },  // visible from photo
    seasons:        { value: Season[], confidence },
    occasions:      { value: Occasion[], confidence },
    suggested_name: { value: string, confidence }  // e.g., "Cream silk camisole"
  },
  caption: string,    // voice-y one-liner: "Looks like a forest-green knit jumper."
  warnings: string[]  // e.g., "Photo's a bit dark", "Multiple items detected"
}
```

## Prompt template

### System message

```
You are the AI behind ReWear, a wardrobe app. The user has just photographed a clothing item.

Your job: identify the item and pre-fill metadata fields the user can confirm or edit.

Speak as ReWear: a quietly confident, observational older-sister voice. Short sentences. No emoji. No hustle slang. No corporate-eco phrases. UK English.

Rules:
- Be conservative with confidence: only 'high' if you're sure. Default to 'medium'.
- For colour, use plain English: "cream", "forest green", "mid blue", "indigo", "tan", "sage", "clay" — not "off-white-ecru-bone".
- Material guess: only fill if visible (knit texture = wool/cotton-blend; obvious silk; obvious denim). Otherwise null.
- Suggested name: short, descriptive, no brand: "Cream silk camisole", "Indigo straight jeans", "Forest green knit jumper".
- Caption: voice-y one-liner the user will see at top of the review screen. Examples:
   - "Looks like a forest-green knit jumper."
   - "A pair of vintage straight-leg jeans."
   - "A cream silk camisole — nice."
- If you can't identify (blurry, multiple items, weird angle), set `recognised: false` and add a warning.

Output ONLY valid JSON matching this schema:
{
  "recognised": boolean,
  "fields": {
    "category": { "value": "top|bottom|tshirt|dress|coat|shoes|accessory", "confidence": "high|medium|low" },
    "subcategory": { "value": "...", "confidence": "..." },
    "primary_colour": { "value": "...", "confidence": "..." },
    "secondary_colour": { "value": "..." | null, "confidence": "..." },
    "material_guess": { "value": "..." | null, "confidence": "..." },
    "seasons": { "value": ["winter|spring|summer|autumn|all"], "confidence": "..." },
    "occasions": { "value": ["casual|work|evening|athletic|special"], "confidence": "..." },
    "suggested_name": { "value": "...", "confidence": "..." }
  },
  "caption": "...",
  "warnings": ["..."]
}
```

### User message

```
[image attached]

Identify this item.
```

## Example output

```json
{
  "recognised": true,
  "fields": {
    "category":       { "value": "top",          "confidence": "high" },
    "subcategory":    { "value": "knit jumper",  "confidence": "high" },
    "primary_colour": { "value": "forest green", "confidence": "high" },
    "secondary_colour": { "value": null,         "confidence": "high" },
    "material_guess": { "value": "wool",         "confidence": "medium" },
    "seasons":        { "value": ["autumn","winter","spring"], "confidence": "high" },
    "occasions":      { "value": ["casual","work"], "confidence": "medium" },
    "suggested_name": { "value": "Forest-green knit jumper", "confidence": "high" }
  },
  "caption": "Looks like a forest-green knit jumper.",
  "warnings": []
}
```

## Failure modes

| Trigger | Behaviour |
|---|---|
| Photo too dark / blurry | `recognised: false`, warning: "This shot's a bit dark — try again with more light?" — UI lets user retake or proceed manually |
| Multiple items in photo | `recognised: false`, warning: "Looks like a few things in there — focus on one?" |
| Item is not clothing | `recognised: false`, warning: "This doesn't look like a wardrobe item." |
| Hallucinated category (e.g., recognises a dog as a top) | Confidence indicators help — UI flags low-confidence fields visually for review |
| Network / API failure | Toast: "Couldn't read that one. Add details manually?" — user proceeds with manual form |

## Performance targets

- p50 latency: <3s (includes upload + vision call)
- p95 latency: <8s
- Cost: target <£0.003 per upload

## UX rule

**Never block on AI.** If the AI takes more than 5s, show the manual form with "We're still looking — fill in what you know" — and merge AI output when it lands.

---

# Cross-cutting AI principles

1. **Voice consistency** — every AI feature shares the same system-message voice fragment.
2. **Structured output** — never free-form text the UI has to parse. Always JSON.
3. **Fail gracefully** — never leave the user stuck. Always a fallback.
4. **Show the working** — when the AI surfaces a recommendation, also surface its reasoning ("the forest knit's been quiet since Tuesday"). Maya should feel the AI is observant, not magical.
5. **Conservative confidence** — when in doubt, the AI says "medium" or "low" so the UI can flag for user review.
6. **Cache aggressively** — wardrobe context is the same across many calls. Use Anthropic prompt caching to drop cost ~75%.
7. **UK English everywhere** — colour, behaviour, organise.
