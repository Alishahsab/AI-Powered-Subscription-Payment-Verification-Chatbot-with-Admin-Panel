import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

// Fallback while the licensed Neue Montreal files are not in public/fonts (see globals.css)
const fallback = Inter_Tight({ variable: "--font-heading", subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

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
    <html lang="en" className={`${fallback.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
