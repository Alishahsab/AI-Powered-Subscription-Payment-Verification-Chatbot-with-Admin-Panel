import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ResetPinEntry from "./ResetPinEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  if (process.env.APP_MODE === "admin") notFound();
  return <ResetPinEntry />;
}
