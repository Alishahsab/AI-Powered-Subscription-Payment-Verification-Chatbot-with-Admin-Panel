import { classNames } from "@/lib/format";
import type { SettingsTabProps } from "../settingsTabs";
import { SettingsSection } from "../SettingsSection";

const colors = [
  { name: "Brand navy", value: "#0C2660" },
  { name: "Emerald", value: "#0F7B5F" },
  { name: "Royal", value: "#3B4FD8" },
  { name: "Bronze", value: "#9A6B24" },
  { name: "Charcoal", value: "#1F2329" },
];

export default function AppearanceTab({ draft, updateDraft }: SettingsTabProps) {
  const current = draft.settings.accent.toLowerCase();

  return (
    <SettingsSection title="Chatbot colour" description="Main colour used on the customer chatbot.">
      <div className="flex flex-wrap items-center gap-2.5">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => updateDraft((next) => (next.settings.accent = color.value))}
            className={classNames(
              "flex items-center gap-2 h-11 pl-1.5 pr-3.5 rounded-xl border text-[13px] font-medium",
              current === color.value.toLowerCase() ? "border-[#0C2660] ring-4 ring-[#0C2660]/10" : "border-zinc-200"
            )}
          >
            <span className="size-8 rounded-lg" style={{ background: color.value }} />
            {color.name}
          </button>
        ))}
        <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-zinc-200 text-[13px] font-medium cursor-pointer">
          <input type="color" value={draft.settings.accent} onChange={(event) => updateDraft((next) => (next.settings.accent = event.target.value))} className="size-7 rounded cursor-pointer" />
          Custom
        </label>
      </div>
    </SettingsSection>
  );
}
