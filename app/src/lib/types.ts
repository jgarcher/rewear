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

export type ShareState = "private" | "borrowable" | "up_for_grabs";

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
  share_state: ShareState;
  lent_to_user_id: string | null;
  return_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BorrowStatus =
  | "pending"
  | "approved"
  | "received"
  | "declined"
  | "returned"
  | "cancelled";

export type BorrowRequest = {
  id: string;
  item_id: string;
  owner_id: string;
  requester_id: string;
  status: BorrowStatus;
  message: string | null;
  requested_for_date: string | null;
  return_by: string | null;
  created_at: string;
  decided_at: string | null;
  received_at: string | null;
  returned_at: string | null;
};

export type Connection = {
  user_id: string;
  friend_id: string;
  created_at: string;
};

export type ConnectionInvite = {
  code: string;
  inviter_id: string;
  used_by_user_id: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
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
  avatar_url: string | null;
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

export const SHARE_STATE_LABELS: Record<ShareState, string> = {
  private: "Private",
  borrowable: "Borrowable",
  up_for_grabs: "Up for grabs",
};

export const SHARE_STATE_HINTS: Record<ShareState, string> = {
  private: "Only you can see this.",
  borrowable: "Friends can ask to borrow.",
  up_for_grabs: "Free for any friend to take. Permanent.",
};

export const COLOUR_OPTIONS = [
  "black", "charcoal", "grey", "white", "cream", "ivory", "beige",
  "tan", "brown", "camel", "forest green", "sage", "olive",
  "navy", "mid blue", "dark indigo", "light blue",
  "red", "clay", "pink", "lilac", "purple", "yellow", "mustard", "mint",
  "multicolour",
] as const;
