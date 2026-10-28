"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { classNames } from "@/lib/format";
import Button from "../ui/Button";
import { SettingsErrors, SettingsTabContent, settingsTabs, type SettingsTabKey } from "./settingsTabs";
import { useSettingsDraft } from "./useSettingsDraft";

export default function Settings({ onSignOut }: { onSignOut?: () => void }) {
  const [tab, setTab] = useState<SettingsTabKey>("availability");
  const { draft, updateDraft, hasChanges, justSaved, errors, save, discard } = useSettingsDraft();

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 bg-white border-b border-zinc-200/80">
        <div className="max-w-[1000px] mx-auto px-4 lg:px-7 pt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[21px] font-semibold tracking-tight">Settings</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">Changes go live on the chatbot when you press Save.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && <span className="text-[12.5px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium">Unsaved changes</span>}
            {!hasChanges && justSaved && (
              <span className="text-[12.5px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 fade-in">
                <Check size={13} /> Saved and live
              </span>
            )}
            <Button onClick={discard} disabled={!hasChanges}>
              Discard
            </Button>
            <Button variant="primary" onClick={save} disabled={!hasChanges} className="px-5">
              Save changes
            </Button>
            {onSignOut && <Button onClick={onSignOut}>Sign out</Button>}
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-4 lg:px-7 mt-4 flex gap-1 overflow-x-auto">
          {settingsTabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={classNames(
                "h-10 px-3.5 text-[13.5px] font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition",
                tab === key ? "border-[#0C2660] text-[#0C2660]" : "border-transparent text-zinc-500 hover:text-zinc-800"
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto p-4 lg:p-7 space-y-5">
          <SettingsErrors errors={errors} />
          <SettingsTabContent tab={tab} draft={draft} updateDraft={updateDraft} />
        </div>
      </div>
    </div>
  );
}
