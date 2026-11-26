import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import OldBrowserNotice from "@/components/OldBrowserNotice";
import "./globals.css";
import Script from "next/script";

const fallbackFont = Inter_Tight({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Premium Store",
  description:
    "Buy your premium subscription and get support in one private chat.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
      <head>
        <meta name="google-adsense-account" content="ca-pub-2681063438215630" />
      </head>
      <body className="min-h-full">
        <OldBrowserNotice />
        {children}
        {/* <Script
          id="google-adsense"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2681063438215630"
          crossOrigin="anonymous"
        /> */}

        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2681063438215630" crossOrigin="anonymous"></script>

      </body>
    </html>
  );
}
