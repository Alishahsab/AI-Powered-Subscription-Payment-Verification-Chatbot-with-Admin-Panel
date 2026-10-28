"use client";

import { useState } from "react";
import { saveSettings, type EditableSettings } from "@/lib/store/admin";
import { stepLines } from "@/lib/store/helpers";
import { useAppState } from "@/lib/store/state";
import type { AppState } from "@/lib/types";
import { validateConfig } from "@/lib/validation";

export type UpdateDraft = (change: (draft: EditableSettings) => void) => void;

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

export function useSettingsDraft() {
  const state = useAppState();
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
    if (problems.length > 0) return false;

    saveSettings(clean);
    setDraft(clean);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    return true;
  };

  const discard = () => setDraft(pickEditable(state));

  return { draft, updateDraft, hasChanges, justSaved, errors, save, discard };
}
