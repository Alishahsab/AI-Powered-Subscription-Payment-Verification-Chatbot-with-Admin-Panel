"use client";

import { useState } from "react";
import ExpandingSearch from "../ui/ExpandingSearch";
import SignalButton from "../ui/SignalButton";
import { useAdminStatus } from "./AdminStatusAvatar";

type AppTopBarProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
};

export default function AppTopBar({ searchQuery, onSearch, onClearSearch }: AppTopBarProps) {
  const status = useAdminStatus();
  const [searching, setSearching] = useState(Boolean(searchQuery));

  const toggleSearch = (open: boolean) => {
    setSearching(open);
    if (!open) onClearSearch();
  };

  return (
    <header className="shrink-0 px-4 pt-3 pb-2">
      <div className="relative flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2.5 rounded-full bg-white p-1.5 pr-4 shadow-[0_8px_24px_-16px_rgba(12,38,96,0.35)]">
          <img src="/logo-icon.png" alt="" className="size-10 rounded-full shrink-0" />
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold text-zinc-900 truncate">Premium Store</div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-zinc-500">
              <span className={`size-1.5 rounded-full ${status.dot}`} />
              Admin · {status.label}
            </div>
          </div>
        </div>
        <span className="size-11 shrink-0" />
        <ExpandingSearch open={searching} onOpenChange={toggleSearch} query={searchQuery} onQueryChange={onSearch} placeholder="Search codes, customers, orders…" rightSpace={52} />
        <SignalButton />
      </div>
    </header>
  );
}
