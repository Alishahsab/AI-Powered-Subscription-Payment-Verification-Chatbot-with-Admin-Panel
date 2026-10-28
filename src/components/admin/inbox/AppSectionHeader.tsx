"use client";

import { useState } from "react";
import { classNames } from "@/lib/format";
import ExpandingSearch from "../ui/ExpandingSearch";

type AppSectionHeaderProps = {
  title: string;
  query: string;
  onQueryChange: (query: string) => void;
  children: React.ReactNode;
};

export default function AppSectionHeader({ title, query, onQueryChange, children }: AppSectionHeaderProps) {
  const [searching, setSearching] = useState(false);

  return (
    <header className="shrink-0 px-4 pt-3">
      <div className="relative flex h-14 items-center">
        <h1 className={classNames("text-[28px] font-extrabold tracking-tight text-[#0C2660] transition-all duration-300", searching && "-translate-x-3 opacity-0")}>{title}</h1>
        <ExpandingSearch open={searching} onOpenChange={setSearching} query={query} onQueryChange={onQueryChange} placeholder="Number, ID, name, plan or code" />
      </div>
      {children}
    </header>
  );
}
