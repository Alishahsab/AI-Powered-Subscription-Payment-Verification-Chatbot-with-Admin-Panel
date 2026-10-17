import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const fallbackFont = Inter_Tight({ variable: "--font-heading", subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Premium Store",
  description: "Buy your premium subscription and get support in one private chat.",
};

export const viewport: Viewport = {
  themeColor: "#f6f7f9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fallbackFont.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
