import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReWear — Wear More. Waste Less.",
  description:
    "The everything wardrobe. Outfits from what you already own, restyling, reselling, donating, eco-brand discovery — all in one app. Open your closet, not another app.",
  metadataBase: new URL("https://rewear.app"),
  openGraph: {
    title: "ReWear — Wear More. Waste Less.",
    description: "Open your closet, not another app.",
    type: "website",
    locale: "en_GB",
    siteName: "ReWear",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReWear",
    description: "Open your closet, not another app.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-linen-100 text-charcoal">
        {children}
      </body>
    </html>
  );
}
