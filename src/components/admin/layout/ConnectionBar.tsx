"use client";

import { WifiOff, Wifi } from "lucide-react";
import { useConnection } from "@/hooks/useConnection";

// Shows when the internet is missing or slow, instead of signing the admin out.
export default function ConnectionBar() {
  const { online, slow } = useConnection();
  if (online && !slow) return null;

  return (
    <div role="status" className="shrink-0 flex items-center justify-center gap-2 px-4 py-1.5 text-[12.5px] bg-amber-50 text-amber-900 border-b border-amber-200">
      {online ? <Wifi size={14} className="shrink-0" /> : <WifiOff size={14} className="shrink-0" />}
      {online ? "Slow internet connection. Updates may take a moment." : "No internet connection. Changes will be sent when you are back online."}
    </div>
  );
}
