import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
// Free, commercially licensed stand-in for Neue Montreal (headings)
const display = Inter_Tight({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Premium Store",
  description: "Buy your premium subscription, get support and view your order history.",
};

export const viewport: Viewport = {
  themeColor: "#f6f7f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${display.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
