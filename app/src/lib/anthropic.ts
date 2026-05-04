// Claude wrapper — server-only.
// Pattern follows the claude-api skill: messages.parse with zodOutputFormat
// for typed structured output, plus prompt caching on the wardrobe context.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic();
  }
  return _client;
}

// === Outfit Generator schema (ADR 014) ===

export const OutfitItemRoleSchema = z.enum([
  "top",
  "bottom",
  "dress",
  "coat",
  "shoes",
  "accessory",
]);

export const OutfitSchema = z.object({
  outfit: z
    .object({
      items: z
        .array(
          z.object({
            item_id: z.string(),
            role: OutfitItemRoleSchema,
          })
        )
        .min(2)
        .max(6),
      reasoning: z
        .string()
        .describe(
          "1-3 sentences in ReWear voice. Specific. Observational. Reference the wardrobe data."
        ),
      weather_note: z
        .string()
        .nullable()
        .describe(
          "Optional. Comment about how the outfit handles the weather, e.g. 'Chore coat for the rain.'"
        ),
      confidence: z.enum(["high", "medium", "low"]),
    })
    .nullable(),
  fallback_message: z
    .string()
    .nullable()
    .describe(
      "Set this when outfit is null and explain why no outfit could be composed."
    ),
});

export type OutfitResult = z.infer<typeof OutfitSchema>;

const SYSTEM_PROMPT = `You are the AI behind ReWear, a wardrobe app.

Speak as ReWear: a quietly confident, observational older-sister voice. Use the user's wardrobe data to be specific. Never preach about sustainability — let the data speak. Short sentences. No emoji. No hustle slang. No corporate-eco phrases. UK English throughout (colour, behaviour, organise).

Your job: pick a complete outfit from the user's wardrobe for the context the user gives you.

Rules:
- Always include exactly one set: either {top + bottom + shoes} OR {dress + shoes}
- The "role" you return for each item MUST match that item's category. A skirt or jeans (category "bottom") is role "bottom", never "accessory". Only items with category "accessory" may use role "accessory" — those are belts, scarves, hats, jewellery, sunglasses, watches, bags. If the wardrobe has no real accessory, skip the accessory slot
- Add a coat if temperature ≤ 16°C OR weather is rainy / snow / wind
- Optional accessory only if it adds something material; otherwise skip it
- Strongly prefer items the user hasn't worn lately (high last-worn-days, low wear-count) — but don't break the outfit for it
- Don't combine 4+ different bright colours; aim for 2-3 colours max
- Match formality with occasion (school/casual loose, work polished, evening considered, special pieces only for special)
- Filter to season-appropriate items unless the item is tagged "all"
- NEVER include items the user has worn in the recent_wears list
- Some items have "borrowable_from" set — they belong to a friend. Use these sparingly: pick at most one per outfit, and only when a friend's piece is genuinely the right fit. When you do, name the friend in the reasoning ("borrow Anna's white Vejas")
- The user may provide "favourite_pairs" — combinations they've explicitly marked as good together. When you pick one item from a favourite pair and the others fit the occasion + weather, prefer keeping them together. These are user-validated good combinations
- "liked_combos" are recent outfits the user thumbed up — lean toward similar shapes / colour stories
- "disliked_combos" are recent outfits the user thumbed down — never reproduce those exact item combinations, and adjust away from whatever pattern they suggest (e.g. if multiple disliked combos paired the same colours, avoid that pairing)

Reasoning style — exactly 1 to 3 short sentences in the ReWear voice:
- Reference specific items by name and a wear-data observation
- Examples: "The forest knit, vintage 501s, white Vejas. The merino's been quiet since Tuesday."
- Examples: "That dress has been waiting since November. Black knit, white Vejas to dress it down."
- Examples: "Cream cami, black trousers, tan loafers. The cami's barely seen the light this year."

If you genuinely cannot compose a coherent outfit (wardrobe too small, every option in recent_wears, occasion not matched), set outfit to null and write a one-sentence fallback_message in voice.`;

type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  primary_colour: string;
  secondary_colour: string | null;
  brand: string | null;
  material: string | null;
  seasons: string[];
  occasions: string[];
  condition: string;
  status: string;
  wear_count: number;
  last_worn_date: string | null;
  // When set, this item belongs to a friend and is marked borrowable.
  // The user would need to ask to borrow before wearing it.
  borrowable_from?: string | null;
};

type GenerateInput = {
  wardrobe: WardrobeItem[];
  recentWearIds: string[]; // last 14 days
  occasion: string;
  vibe: string | null;
  weatherTempC: number;
  weatherCondition: string;
  weatherDescription: string;
  // User-curated combinations: items explicitly marked as going together
  favouritePairs?: Array<{ name: string | null; itemIds: string[] }>;
  // Recent feedback: combinations the user thumbed up / down
  likedCombos?: string[][];
  dislikedCombos?: string[][];
};

export async function generateOutfit(
  input: GenerateInput
): Promise<OutfitResult> {
  const wardrobeJson = JSON.stringify(input.wardrobe, null, 0);

  const response = await anthropic().messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Wardrobe (item_id and metadata for every active piece):\n${wardrobeJson}`,
            // Cache the wardrobe context — same user, multiple shuffles
            // get the cached read on every call after the first.
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Today:
- Occasion: ${input.occasion}
- Vibe: ${input.vibe ?? "no preference"}
- Weather: ${input.weatherTempC}°C, ${input.weatherCondition} (${input.weatherDescription})
- Recent wears (last 14 days, exclude these item_ids): ${
              input.recentWearIds.length > 0
                ? input.recentWearIds.join(", ")
                : "none"
            }
- Favourite pairs (user-curated combinations): ${
              input.favouritePairs && input.favouritePairs.length > 0
                ? JSON.stringify(input.favouritePairs)
                : "none"
            }
- Liked combos (recent thumbs-up, item_ids per outfit): ${
              input.likedCombos && input.likedCombos.length > 0
                ? JSON.stringify(input.likedCombos)
                : "none"
            }
- Disliked combos (recent thumbs-down, item_ids per outfit — avoid these patterns): ${
              input.dislikedCombos && input.dislikedCombos.length > 0
                ? JSON.stringify(input.dislikedCombos)
                : "none"
            }

Build me an outfit.`,
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(OutfitSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("AI returned an unparseable response");
  }

  return response.parsed_output;
}

// === Trip Planner — multi-day outfit plan ===

export const TripPlanSchema = z.object({
  trip_name: z
    .string()
    .nullable()
    .describe(
      "Short suggested trip name in ReWear voice. Optional. e.g. 'Greek week', 'Wedding weekend'"
    ),
  days: z.array(
    z.object({
      day_index: z.number().describe("0-based index into the requested dates"),
      outfit: z
        .object({
          items: z
            .array(
              z.object({
                item_id: z.string(),
                role: OutfitItemRoleSchema,
              })
            )
            .min(2)
            .max(6),
          reasoning: z
            .string()
            .describe(
              "1 sentence in ReWear voice. Reference one specific item by name."
            ),
        })
        .nullable(),
      fallback_message: z
        .string()
        .nullable()
        .describe("Set when outfit is null and explain why."),
    })
  ),
  notes: z
    .string()
    .nullable()
    .describe("Optional one-line trip-level note in voice. e.g. 'Leaning into linen since it's hot'"),
});

export type TripPlanResult = z.infer<typeof TripPlanSchema>;

const TRIP_SYSTEM_PROMPT = `You are the AI behind ReWear, planning a multi-day trip wardrobe from the user's closet.

Speak as ReWear: quietly confident, observational older-sister voice. Short sentences. UK English. No emoji, no preachy sustainability talk.

Your job: given a date range, a free-text trip context (e.g. "Greece, casual, beach + dinners"), and the user's wardrobe, build one outfit per day.

Rules:
- One coherent outfit per day, indexed 0..N-1
- Each outfit follows the same composition rules as single-outfit generation: {top + bottom + shoes} OR {dress + shoes}, optional coat / accessory only when warranted
- Role MUST match item category. A skirt or jeans is role "bottom", never "accessory"
- Vary across days: don't repeat the SAME hero piece twice unless the trip spans 5+ days. Even then, alternate
- Match the implied weather and formality of the trip context. "Greece in summer" = warm, no coats. "Ski weekend" = layers, coat every day. Don't overthink — use common sense
- Respect favourite_pairs (user-curated), liked_combos (lean toward), disliked_combos (avoid those exact item combos and the patterns they suggest)
- NEVER pick items in the recent_wears exclusion list
- Some items have borrowable_from set — use sparingly, max one borrowable item per day, mention the friend's name in reasoning

For each day, write a 1-sentence reasoning in voice — name one item.

If you can't compose an outfit for a particular day (wardrobe too thin, occasion not represented, etc.), set that day's outfit to null and write a one-sentence fallback_message in voice.

Optionally suggest a short trip_name and a one-line trip-level note.`;

type TripPlanInput = {
  wardrobe: WardrobeItem[];
  recentWearIds: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  numDays: number;
  tripContext: string; // free text
  favouritePairs?: Array<{ name: string | null; itemIds: string[] }>;
  likedCombos?: string[][];
  dislikedCombos?: string[][];
};

export async function generateTripPlan(
  input: TripPlanInput
): Promise<TripPlanResult> {
  const wardrobeJson = JSON.stringify(input.wardrobe, null, 0);

  const response = await anthropic().messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: TRIP_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Wardrobe (item_id and metadata for every active piece):\n${wardrobeJson}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Trip:
- Dates: ${input.startDate} → ${input.endDate} (${input.numDays} days)
- Context: ${input.tripContext || "(no description)"}
- Recent wears (last 14 days, exclude): ${
              input.recentWearIds.length > 0
                ? input.recentWearIds.join(", ")
                : "none"
            }
- Favourite pairs: ${
              input.favouritePairs && input.favouritePairs.length > 0
                ? JSON.stringify(input.favouritePairs)
                : "none"
            }
- Liked combos: ${
              input.likedCombos && input.likedCombos.length > 0
                ? JSON.stringify(input.likedCombos)
                : "none"
            }
- Disliked combos: ${
              input.dislikedCombos && input.dislikedCombos.length > 0
                ? JSON.stringify(input.dislikedCombos)
                : "none"
            }

Plan an outfit for each day. Return ${input.numDays} day entries indexed 0..${
              input.numDays - 1
            }.`,
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(TripPlanSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("AI returned an unparseable response");
  }
  return response.parsed_output;
}

// === Auto-tag (Claude vision) — ADR 014 Feature 2 ===

export const AutoTagItemSchema = z.object({
  suggested_name: z
    .string()
    .nullable()
    .describe(
      "Short, descriptive, no brand. Examples: 'Forest-green knit jumper', 'Cream silk camisole', 'Indigo straight jeans'."
    ),
  category: z
    .enum(["top", "tshirt", "bottom", "dress", "coat", "shoes", "accessory"])
    .nullable(),
  subcategory: z
    .string()
    .nullable()
    .describe("e.g. 'knit jumper', 'tank', 'midi skirt', 'trainers'."),
  brand: z
    .string()
    .nullable()
    .describe(
      "Brand name only if visibly legible on a label, hangtag, embroidery, or print. Don't guess from style. Capitalise normally."
    ),
  primary_colour: z
    .string()
    .nullable()
    .describe(
      "Plain English colour from this set: black / charcoal / grey / white / cream / ivory / beige / tan / brown / camel / forest green / sage / olive / navy / mid blue / dark indigo / light blue / red / clay / pink / lilac / purple / yellow / mustard / mint / multicolour."
    ),
  secondary_colour: z.string().nullable(),
  material: z
    .string()
    .nullable()
    .describe(
      "Only fill if obvious from the photo (denim, leather, knit/wool, silk). Otherwise null."
    ),
  seasons: z.array(z.enum(["winter", "spring", "summer", "autumn", "all"])),
  occasions: z.array(z.enum(["casual", "work", "evening", "athletic", "special"])),
});

export type AutoTagItem = z.infer<typeof AutoTagItemSchema>;

export const AutoTagSchema = z.object({
  recognised: z
    .boolean()
    .describe(
      "Set false if the photo isn't clearly clothing (blurry, multiple non-clothing items, weird angle, not garments)."
    ),
  caption: z
    .string()
    .max(240)
    .describe(
      "ReWear-voice one-liner. Single item: 'Looks like a forest-green knit jumper.' Multiple: 'Three items — a forest knit, indigo straight jeans, white trainers.' Always lead with what you see."
    ),
  items: z
    .array(AutoTagItemSchema)
    .describe(
      "ONE ENTRY PER DISTINCT WARDROBE ITEM visible in the photo. A flat lay of one piece returns 1 item. A selfie of someone wearing a top and bottom returns 2 items. An outfit shot with top + bottom + shoes returns 3 items. Don't return separate entries for the same garment from different angles."
    ),
  warnings: z
    .array(z.string())
    .describe("Any photo concerns: dark, blurry, item not clearly visible."),
});

export type AutoTagResult = z.infer<typeof AutoTagSchema>;

const AUTO_TAG_SYSTEM_PROMPT = `You are the AI behind ReWear, a wardrobe app. The user has just photographed clothing to add to their digital wardrobe.

Speak as ReWear: a quietly confident, observational older-sister voice. Short sentences. No emoji. No hustle slang. UK English throughout (colour, behaviour, organise).

Your job: look at the photo and identify EVERY distinct clothing item visible, then pre-fill metadata for each so the user can confirm or edit.

CRITICAL — multiple items in one photo:
- A flat lay or close-up of one garment → return 1 item.
- A selfie/mirror shot of someone wearing a top + bottom → return 2 items (top, bottom).
- A full outfit photo with top + bottom + shoes → return 3 items.
- A hanger photo with two pieces → return 2 items.
- Don't return separate entries for the same garment from different angles.
- Skip accessories like bags or jewellery unless they're clearly the focus.
- A dress is one item even though it covers torso + legs.
- Layered tops (e.g. cardigan over a shirt) → 2 items if both are clearly visible.

For each detected item, fill the fields:
- Be conservative. Set fields to null if you can't see clearly. Don't guess.
- Colour vocabulary is fixed — use only plain English from: black, charcoal, grey, white, cream, ivory, beige, tan, brown, camel, forest green, sage, olive, navy, mid blue, dark indigo, light blue, red, clay, pink, lilac, purple, yellow, mustard, mint, multicolour.
- Material: only fill when obvious (visible knit texture → wool; obvious denim, silk, leather). Otherwise null.
- Suggested name: short, descriptive, no brand. Reference colour + style. "Forest-green knit jumper", "Indigo straight jeans", "Black ankle boots".
- Brand: read off a label / hangtag / embroidery / print only if clearly legible. Don't guess from style.
- Categories: top, tshirt, bottom, dress, coat, shoes, accessory.

Caption — the voice-led one-liner the user reads at the top of the review screen:
- 1 item: "Looks like a forest-green knit jumper."
- 2+ items: "Two items — a forest knit and indigo jeans." or "Three: forest knit, dark jeans, white trainers."
- Always specific. Always observational. Never preachy.

If the photo isn't clearly clothing (blurry, dark, no garments visible): set recognised: false and items: [], explain in caption + warnings.`;

export async function analyzeWardrobePhoto(
  photoUrl: string
): Promise<AutoTagResult> {
  const response = await anthropic().messages.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: AUTO_TAG_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: photoUrl },
          },
          {
            type: "text",
            text: "Identify this clothing item. Pre-fill the metadata so the user can confirm or edit.",
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(AutoTagSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("AI returned an unparseable response");
  }

  return response.parsed_output;
}
