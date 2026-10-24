"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { onSyncProblem } from "@/lib/supabase/sync";

const SHOW_FOR_MS = 8000;

// Tells the person when the server refused something they just did. The screen is reloaded
// from the server at the same time, so it shows what was really saved.
export default function SyncNotice() {
  const [message, setMessage] = useState("");

  useEffect(() => onSyncProblem(setMessage), []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), SHOW_FOR_MS);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div role="alert" className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)] rounded-xl bg-[#3b1c1c] text-white shadow-2xl px-4 py-3 flex items-start gap-3 fade-in">
      <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-300" />
      <div className="flex-1 text-[13.5px] leading-snug">
        <div className="font-semibold">That could not be saved</div>
        <div className="text-white/80">{message}</div>
      </div>
      <button onClick={() => setMessage("")} className="shrink-0 text-white/60 hover:text-white" aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}
