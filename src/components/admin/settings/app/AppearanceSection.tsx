"use client";

import { classNames } from "@/lib/format";
import type { PageProps } from "./pages";
import { Group } from "./ui";

const colors = [
  { name: "Navy", value: "#0C2660" },
  { name: "Emerald", value: "#0F7B5F" },
  { name: "Royal", value: "#3B4FD8" },
  { name: "Bronze", value: "#9A6B24" },
  { name: "Charcoal", value: "#1F2329" },
];

const tile = "rounded-2xl border-2 p-2.5 text-center text-[12px] font-semibold text-zinc-700";

export default function AppearanceSection({ draft, updateDraft }: PageProps) {
  const accent = draft.settings.accent;
  const isCustom = !colors.some((color) => color.value.toLowerCase() === accent.toLowerCase());

  return (
    <Group title="Chatbot colour" plain>
      <div className="grid grid-cols-3 gap-2 p-2.5">
        {colors.map((color) => {
          const selected = color.value.toLowerCase() === accent.toLowerCase();
          return (
            <button
              key={color.value}
              onClick={() => updateDraft((next) => (next.settings.accent = color.value))}
              className={classNames(tile, selected ? "border-[#0C2660] bg-white" : "border-transparent bg-[#f3f5fa]")}
            >
              <span className="mx-auto mb-1.5 block size-10 rounded-full ring-1 ring-inset ring-zinc-300" style={{ background: color.value }} />
              {color.name}
            </button>
          );
        })}
        <label className={classNames(tile, "relative cursor-pointer", isCustom ? "border-[#0C2660] bg-white" : "border-transparent bg-[#f3f5fa]")}>
          <span
            className="mx-auto mb-1.5 block size-10 rounded-full"
            style={{ background: isCustom ? accent : "conic-gradient(#f43f5e,#f59e0b,#10b981,#3b82f6,#a855f7,#f43f5e)" }}
          />
          Custom
          <input type="color" value={accent} onChange={(event) => updateDraft((next) => (next.settings.accent = event.target.value))} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
    </Group>
  );
}
