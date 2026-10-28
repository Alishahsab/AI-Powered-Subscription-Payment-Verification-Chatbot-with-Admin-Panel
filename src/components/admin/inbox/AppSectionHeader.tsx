"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { classNames } from "@/lib/format";
import ExpandingSearch from "../ui/ExpandingSearch";
import SignalButton from "../ui/SignalButton";

type AppSectionHeaderProps = {
  title: string;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  onBack?: () => void;
  children: React.ReactNode;
};

export default function AppSectionHeader({ title, query, onQueryChange, placeholder = "Number, ID, name, plan or code", onBack, children }: AppSectionHeaderProps) {
  const [searching, setSearching] = useState(false);

  return (
    <header className="shrink-0 px-4 pt-3">
      <div className="relative flex h-14 items-center gap-2">
        <div className={classNames("flex-1 min-w-0 flex items-center gap-2.5 transition-all duration-300", searching && "-translate-x-3 opacity-0")}>
          {onBack && (
            <button onClick={onBack} className="size-11 shrink-0 rounded-full bg-white text-[#0C2660] shadow-[0_8px_24px_-16px_rgba(12,38,96,0.4)] grid place-items-center" aria-label="Back">
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>
          )}
          <h1 className={classNames("truncate font-extrabold tracking-tight text-[#0C2660]", onBack ? "text-[24px]" : "text-[28px]")}>{title}</h1>
        </div>
        <SignalButton />
        <span className="size-11 shrink-0" />
        <ExpandingSearch open={searching} onOpenChange={setSearching} query={query} onQueryChange={onQueryChange} placeholder={placeholder} />
      </div>
      {children}
    </header>
  );
}
