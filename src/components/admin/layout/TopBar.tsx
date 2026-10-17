"use client";

import { Menu, Search, X } from "lucide-react";
import type { Navigate } from "../navigation";
import NotificationBell from "./NotificationBell";
import StatusSwitch from "./StatusSwitch";

type TopBarProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onOpenMenu: () => void;
  onNavigate: Navigate;
};

export default function TopBar({ searchQuery, onSearch, onClearSearch, onOpenMenu, onNavigate }: TopBarProps) {
  return (
    <>
      <header className="h-16 shrink-0 bg-white border-b border-zinc-200/80 flex items-center gap-3 px-4 lg:px-6">
        <button onClick={onOpenMenu} className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-zinc-100" aria-label="Open menu">
          <Menu size={19} />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search codes, customers, orders, messages…"
            className="w-full h-9 rounded-lg bg-zinc-100/80 border border-transparent pl-9 pr-8 text-[13.5px] outline-none focus:bg-white focus:border-zinc-300 transition"
          />
          {searchQuery && (
            <button onClick={onClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700" aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <StatusSwitch />
          </div>
          <NotificationBell onNavigate={onNavigate} />
          <div className="size-9 rounded-full bg-[#0C2660] text-white grid place-items-center text-[12px] font-semibold">AD</div>
        </div>
      </header>

      <div className="md:hidden px-4 py-2 bg-white border-b border-zinc-200/80">
        <StatusSwitch fullWidth />
      </div>
    </>
  );
}
