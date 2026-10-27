import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const appFont = Plus_Jakarta_Sans({ variable: "--font-app", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Admin · Premium Store",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={appFont.variable}>{children}</div>;
}
