"use client";

import { useState } from "react";
import { Moon, Search, Sun, X } from "lucide-react";
import type { AdminTheme } from "@/hooks/useAdminTheme";
import type { Navigate } from "../navigation";
import AdminStatusAvatar, { useAdminStatus } from "./AdminStatusAvatar";

type AppTopBarProps = {
  searchQuery: string;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onNavigate: Navigate;
  theme: AdminTheme;
  onToggleTheme: () => void;
};

const roundButton = "size-11 shrink-0 rounded-full bg-white text-zinc-800 shadow-[0_8px_24px_-16px_rgba(12,38,96,0.35)] grid place-items-center";

// The top of the panel inside the admin app: the store pill on the left, theme, search and the admin on the right.
export default function AppTopBar({ searchQuery, onSearch, onClearSearch, onNavigate, theme, onToggleTheme }: AppTopBarProps) {
  const status = useAdminStatus();
  const [searching, setSearching] = useState(Boolean(searchQuery));

  const closeSearch = () => {
    setSearching(false);
    onClearSearch();
  };

  return (
    <header className="shrink-0 px-4 pt-3 pb-2 space-y-2.5">
      <div className="flex items-center gap-2">
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
        <button onClick={onToggleTheme} className={roundButton} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button onClick={() => (searching ? closeSearch() : setSearching(true))} className={roundButton} aria-label={searching ? "Close search" : "Search"}>
          {searching ? <X size={19} /> : <Search size={19} />}
        </button>
        <AdminStatusAvatar onNavigate={onNavigate} large />
      </div>

      {searching && (
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search codes, customers, orders, messages…"
            className="w-full h-11 rounded-full bg-white pl-10 pr-4 text-[14px] outline-none shadow-[0_8px_24px_-16px_rgba(12,38,96,0.35)] placeholder:text-zinc-400"
          />
        </div>
      )}
    </header>
  );
}
