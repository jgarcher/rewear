import { EmptyShell } from "@/components/EmptyShell";

export const metadata = { title: "Wardrobe — ReWear" };

export default function WardrobePage() {
  return (
    <EmptyShell
      eyebrow="Wardrobe"
      title="Your closet, sorted."
      description="Add items by photo. We'll auto-tag the basics — type, colour, season — and you fill in the rest. Coming next session."
    />
  );
}
