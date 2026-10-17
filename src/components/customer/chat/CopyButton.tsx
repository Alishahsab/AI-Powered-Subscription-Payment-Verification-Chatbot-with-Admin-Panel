"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/browser";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await copyToClipboard(value.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button onClick={copy} className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 h-7 rounded-lg bg-black/[0.05] hover:bg-black/[0.08] transition">
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}
