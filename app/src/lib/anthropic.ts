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
- Add a coat if temperature ≤ 16°C OR weather is rainy / snow / wind
- Optional accessory only if it adds something material; otherwise skip it
- Strongly prefer items the user hasn't worn lately (high last-worn-days, low wear-count) — but don't break the outfit for it
- Don't combine 4+ different bright colours; aim for 2-3 colours max
- Match formality with occasion (school/casual loose, work polished, evening considered, special pieces only for special)
- Filter to season-appropriate items unless the item is tagged "all"
- NEVER include items the user has worn in the recent_wears list

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
};

type GenerateInput = {
  wardrobe: WardrobeItem[];
  recentWearIds: string[]; // last 14 days
  occasion: string;
  vibe: string | null;
  weatherTempC: number;
  weatherCondition: string;
  weatherDescription: string;
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

// === Auto-tag (Claude vision) — ADR 014 Feature 2 ===

export const AutoTagSchema = z.object({
  recognised: z
    .boolean()
    .describe("Set false if the photo isn't clearly a single clothing item."),
  caption: z
    .string()
    .max(200)
    .describe(
      "ReWear-voice one-liner the user sees at the top of the review screen. Examples: 'Looks like a forest-green knit jumper.' / 'A cream silk camisole — nice.' / 'Vintage straight-leg jeans.'"
    ),
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
  warnings: z
    .array(z.string())
    .describe(
      "Any concerns about the photo: blurry, dark, multiple items, weird angle, not clothing."
    ),
});

export type AutoTagResult = z.infer<typeof AutoTagSchema>;

const AUTO_TAG_SYSTEM_PROMPT = `You are the AI behind ReWear, a wardrobe app. The user has just photographed a clothing item to add to their digital wardrobe.

Speak as ReWear: a quietly confident, observational older-sister voice. Short sentences. No emoji. No hustle slang. UK English throughout (colour, behaviour, organise).

Your job: look at the photo and pre-fill metadata fields the user can confirm or edit.

Rules:
- Be conservative. Set fields to null if you can't see clearly. Don't guess.
- Colour vocabulary is fixed — use only plain English from: black, charcoal, grey, white, cream, ivory, beige, tan, brown, camel, forest green, sage, olive, navy, mid blue, dark indigo, light blue, red, clay, pink, lilac, purple, yellow, mustard, mint, multicolour.
- Material: only fill when obvious from the photo (visible knit texture → wool; obvious denim, silk, leather). Otherwise null.
- Suggested name: short, descriptive, no brand. Reference colour + style. Examples: "Forest-green knit jumper", "Cream silk camisole", "Indigo straight jeans", "Black ankle boots".
- Caption (voice-led one-liner the user reads at the top of the review screen):
   - "Looks like a forest-green knit jumper."
   - "A cream silk camisole — nice."
   - "Vintage straight-leg jeans."
   - "Black ankle boots. Worn-in."
- Categories: pick exactly one of top, tshirt, bottom, dress, coat, shoes, accessory.
- Seasons: any combination of winter / spring / summer / autumn / all.
- Occasions: any combination of casual / work / evening / athletic / special.
- If the photo is ambiguous (blurry, multiple items, not clearly clothing): set recognised: false, write a brief voice-led caption explaining what you'd need, and add a clear warning.`;

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
