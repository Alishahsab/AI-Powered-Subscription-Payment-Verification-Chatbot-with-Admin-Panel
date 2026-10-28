"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

type AppSectionHeaderProps = {
  title: string;
  query: string;
  onQueryChange: (query: string) => void;
  children: React.ReactNode;
};

export default function AppSectionHeader({ title, query, onQueryChange, children }: AppSectionHeaderProps) {
  const [searching, setSearching] = useState(false);

  const closeSearch = () => {
    setSearching(false);
    onQueryChange("");
  };

  return (
    <header className="shrink-0 px-4 pt-3">
      <div className="flex items-center justify-between py-1.5">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0C2660]">{title}</h1>
        <button
          onClick={() => (searching ? closeSearch() : setSearching(true))}
          className="size-11 rounded-full bg-white text-[#0C2660] shadow-[0_8px_24px_-16px_rgba(12,38,96,0.4)] grid place-items-center"
          aria-label={searching ? "Close search" : "Search"}
        >
          {searching ? <X size={20} strokeWidth={2.4} /> : <Search size={20} strokeWidth={2.4} />}
        </button>
      </div>

      {searching && (
        <div className="relative mt-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Number, ID, name, plan or code"
            className="w-full h-11 rounded-full bg-white pl-10 pr-4 text-[14px] outline-none shadow-[0_8px_24px_-16px_rgba(12,38,96,0.35)] placeholder:text-zinc-400"
          />
        </div>
      )}

      {children}
    </header>
  );
}
