// ReWear shared types — match Supabase schema (ADR 012) and taxonomy (ADR 015)

export type ItemCategory =
  | "top"
  | "tshirt"
  | "bottom"
  | "dress"
  | "coat"
  | "shoes"
  | "accessory";

export type ItemCondition = "new" | "like-new" | "good" | "worn-in" | "needs-mending";

export type AcquiredSource =
  | "new"
  | "sale"
  | "vinted"
  | "depop"
  | "charity-shop"
  | "gift"
  | "hand-me-down"
  | "swap"
  | "unknown";

export type ItemStatus = "active" | "listed" | "donated" | "upcycled" | "retired";

export type Season = "winter" | "spring" | "summer" | "autumn" | "all";
export type Occasion = "casual" | "work" | "evening" | "athletic" | "special";

export type WardrobeItem = {
  id: string;
  user_id: string;
  name: string;
  category: ItemCategory;
  subcategory: string | null;
  primary_colour: string;
  secondary_colour: string | null;
  brand: string | null;
  material: string | null;
  seasons: Season[];
  occasions: Occasion[];
  acquired_date: string | null;
  acquired_source: AcquiredSource;
  estimated_price: number | null;
  condition: ItemCondition;
  photo_url: string | null;
  notes: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

export type DidYouKnowFact = {
  id: string;
  fact: string;
  source: string | null;
  source_publication: string | null;
  source_year: number | null;
  source_url: string | null;
  category: string | null;
  confidence: "peer-reviewed" | "industry-report" | "general-knowledge";
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  streak_count: number;
  last_logged_date: string | null;
  lifetime_rewears: number;
};

// === Display labels ===
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  top: "Top",
  tshirt: "T-shirt",
  bottom: "Bottom",
  dress: "Dress",
  coat: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

export const COLOUR_OPTIONS = [
  "black", "charcoal", "grey", "white", "cream", "ivory", "beige",
  "tan", "brown", "camel", "forest green", "sage", "olive",
  "navy", "mid blue", "dark indigo", "light blue",
  "red", "clay", "pink", "lilac", "purple", "yellow", "mustard", "mint",
  "multicolour",
] as const;
