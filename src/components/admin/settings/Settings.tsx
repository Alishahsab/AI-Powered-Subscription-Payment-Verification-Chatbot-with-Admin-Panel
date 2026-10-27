"use client";

import { useState } from "react";
import { Check, Clock, CreditCard, Inbox, LifeBuoy, Palette, Timer } from "lucide-react";
import { classNames } from "@/lib/format";
import { saveSettings, type EditableSettings } from "@/lib/store/admin";
import { stepLines } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { AppState } from "@/lib/types";
import { validateConfig } from "@/lib/validation";
import Button from "../ui/Button";
import AppearanceTab from "./tabs/AppearanceTab";
import AvailabilityTab from "./tabs/AvailabilityTab";
import InboxTab from "./tabs/InboxTab";
import PaymentsTab from "./tabs/PaymentsTab";
import SupportTab from "./tabs/SupportTab";
import TimersTab from "./tabs/TimersTab";

export type UpdateDraft = (change: (draft: EditableSettings) => void) => void;

export type SettingsTabProps = {
  draft: EditableSettings;
  updateDraft: UpdateDraft;
};

const tabs = [
  { key: "availability", label: "Availability", icon: <Clock size={15} /> },
  { key: "payments", label: "Plans & payments", icon: <CreditCard size={15} /> },
  { key: "support", label: "Support", icon: <LifeBuoy size={15} /> },
  { key: "inbox", label: "Inbox & blocking", icon: <Inbox size={15} /> },
  { key: "timers", label: "Timers & limits", icon: <Timer size={15} /> },
  { key: "appearance", label: "Appearance", icon: <Palette size={15} /> },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function pickEditable(state: AppState): EditableSettings {
  return structuredClone({ settings: state.settings, plans: state.plans, methods: state.methods, faqs: state.faqs });
}

function snapshot(draft: EditableSettings) {
  return JSON.stringify({ ...draft, settings: { ...draft.settings, status: null } });
}

function cleanDraft(draft: EditableSettings): EditableSettings {
  const clean = structuredClone(draft);
  clean.settings.terms = clean.settings.terms.map((term) => term.trim()).filter(Boolean);
  clean.settings.rejectReasons = clean.settings.rejectReasons.map((reason) => reason.trim()).filter(Boolean);
  clean.settings.blocking.reasons = clean.settings.blocking.reasons.map((reason) => reason.trim()).filter(Boolean);
  clean.settings.inboxTabs = clean.settings.inboxTabs.map((tab) => ({ ...tab, label: tab.label.trim() }));
  clean.faqs = clean.faqs.filter((faq) => faq.question.trim() && faq.answer.trim());
  clean.methods = clean.methods.map((method) => ({ ...method, steps: stepLines(method.steps).join("\n") }));
  return clean;
}

export default function Settings({ onSignOut }: { onSignOut?: () => void }) {
  const state = useAppState();
  const [tab, setTab] = useState<TabKey>("availability");
  const [draft, setDraft] = useState(() => pickEditable(state));
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(pickEditable(state)));
  const [justSaved, setJustSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const liveSnapshot = snapshot(pickEditable(state));
  const hasChanges = snapshot(draft) !== liveSnapshot;

  if (liveSnapshot !== savedSnapshot) {
    setSavedSnapshot(liveSnapshot);
    if (snapshot(draft) === savedSnapshot) setDraft(pickEditable(state));
  }

  const updateDraft: UpdateDraft = (change) => {
    setDraft((previous) => {
      const next = structuredClone(previous);
      change(next);
      return next;
    });
  };

  const save = () => {
    const clean = cleanDraft(draft);
    const problems = validateConfig(clean);
    setErrors(problems);
    if (problems.length > 0) return;

    saveSettings(clean);
    setDraft(clean);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

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
            <Button onClick={() => setDraft(pickEditable(state))} disabled={!hasChanges}>
              Discard
            </Button>
            <Button variant="primary" onClick={save} disabled={!hasChanges} className="px-5">
              Save changes
            </Button>
            {onSignOut && <Button onClick={onSignOut}>Sign out</Button>}
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-4 lg:px-7 mt-4 flex gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={classNames(
                "h-10 px-3.5 text-[13.5px] font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition",
                tab === item.key ? "border-[#0C2660] text-[#0C2660]" : "border-transparent text-zinc-500 hover:text-zinc-800"
              )}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto p-4 lg:p-7 space-y-5">
          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              <div className="font-semibold mb-1">Please fix these before saving:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {tab === "availability" && <AvailabilityTab draft={draft} updateDraft={updateDraft} />}
          {tab === "payments" && <PaymentsTab draft={draft} updateDraft={updateDraft} />}
          {tab === "support" && <SupportTab draft={draft} updateDraft={updateDraft} />}
          {tab === "inbox" && <InboxTab draft={draft} updateDraft={updateDraft} />}
          {tab === "timers" && <TimersTab draft={draft} updateDraft={updateDraft} />}
          {tab === "appearance" && <AppearanceTab draft={draft} updateDraft={updateDraft} />}
        </div>
      </div>
    </div>
  );
}
