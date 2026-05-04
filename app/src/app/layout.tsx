import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { TopHeader } from "@/components/TopHeader";
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
  title: "ReWear",
  description: "Open your closet, not another app.",
  metadataBase: new URL("https://app.rewear.ai"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ReWear",
    statusBarStyle: "default",
  },
  applicationName: "ReWear",
  icons: {
    icon: "/rewear-logo.png",
    shortcut: "/rewear-logo.png",
    apple: "/rewear-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Linen for the Safari URL-bar tint, forest for the standalone app theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E6" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-linen-100 text-charcoal">
        <TopHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
