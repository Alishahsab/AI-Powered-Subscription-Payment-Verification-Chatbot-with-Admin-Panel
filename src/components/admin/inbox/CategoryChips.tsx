"use client";

import { useEffect, useRef } from "react";
import { classNames } from "@/lib/format";

export type Chip<Key extends string> = { key: Key; label: string; count: number; urgent?: boolean; dot?: string };

type CategoryChipsProps<Key extends string> = {
  chips: Chip<Key>[];
  selected: Key;
  onSelect: (key: Key) => void;
};

export default function CategoryChips<Key extends string>({ chips, selected, onSelect }: CategoryChipsProps<Key>) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rowRef.current?.querySelector("[data-selected=true]")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div ref={rowRef} className="-mx-4 px-4 mt-3 pb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
      {chips.map((chip) => {
        const active = chip.key === selected;
        return (
          <button
            key={chip.key}
            data-selected={active}
            onClick={() => onSelect(chip.key)}
            className={classNames(
              "shrink-0 h-8 px-3 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 transition-colors duration-200",
              active ? "bg-[#0C2660] border-[#0C2660] text-white" : "bg-white border-zinc-200 text-zinc-700"
            )}
          >
            {chip.dot && <span className={`size-[7px] rounded-full ${chip.dot}`} />}
            {chip.label}
            {chip.count > 0 && (
              <span
                className={classNames(
                  "min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-extrabold grid place-items-center",
                  active ? "bg-[#D4A551] text-[#0C2660]" : chip.urgent ? "bg-red-500 text-white" : "bg-[#eef1f7] text-[#0C2660]"
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
