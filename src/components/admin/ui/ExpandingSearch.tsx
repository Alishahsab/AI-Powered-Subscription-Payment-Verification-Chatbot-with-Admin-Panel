"use client";

import { Search, X } from "lucide-react";
import { classNames } from "@/lib/format";

type ExpandingSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  rightSpace?: number;
};

export default function ExpandingSearch({ open, onOpenChange, query, onQueryChange, placeholder, rightSpace = 0 }: ExpandingSearchProps) {
  return (
    <div
      style={{ right: rightSpace, width: open ? `calc(100% - ${rightSpace}px)` : 44 }}
      className={classNames(
        "absolute top-1/2 z-10 h-11 -translate-y-1/2 flex items-center overflow-hidden rounded-full bg-white transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open ? "shadow-[0_14px_34px_-14px_rgba(12,38,96,0.55)] ring-2 ring-[#D4A551]/50" : "shadow-[0_8px_24px_-16px_rgba(12,38,96,0.4)]"
      )}
    >
      {open && (
        <>
          <Search size={17} strokeWidth={2.4} className="ml-4 shrink-0 text-[#D4A551] fade-in" />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-2.5 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 fade-in"
          />
        </>
      )}
      <button
        onClick={() => {
          if (open) onQueryChange("");
          onOpenChange(!open);
        }}
        className="ml-auto size-11 shrink-0 grid place-items-center text-[#0C2660]"
        aria-label={open ? "Close search" : "Search"}
      >
        <span className={classNames("transition-transform duration-300", open && "rotate-90")}>{open ? <X size={20} strokeWidth={2.4} /> : <Search size={20} strokeWidth={2.4} />}</span>
      </button>
    </div>
  );
}
