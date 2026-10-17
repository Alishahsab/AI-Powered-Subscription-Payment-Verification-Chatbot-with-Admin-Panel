"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { deleteOldChats, resetDemoData } from "@/lib/store/admin";
import Button from "../../ui/Button";
import type { SettingsTabProps } from "../Settings";
import { ChoiceButtons, SettingsSection } from "../SettingsSection";

export default function TimersTab({ draft, updateDraft }: SettingsTabProps) {
  const [cleanupResult, setCleanupResult] = useState("");
  const { timers, retentionDays } = draft.settings;

  const runCleanup = () => {
    const result = deleteOldChats();
    setCleanupResult(`Removed ${result.removedMessages} old messages and ${result.removedScreenshots} screenshots.`);
  };

  const resetDemo = () => {
    if (confirm("Reset all demo data?")) resetDemoData();
  };

  return (
    <>
      <SettingsSection title="Payment timer" description="After this time the bank details are hidden and the unpaid order is cancelled.">
        <ChoiceButtons values={[5, 10, 15, 20, 30]} value={timers.orderMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.orderMinutes = value))} />
      </SettingsSection>

      <SettingsSection title="Non-active chats" description="A chat moves from Active to Non-active after this much time without activity.">
        <ChoiceButtons values={[10, 15, 20, 30]} value={timers.inactiveMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.inactiveMinutes = value))} />
      </SettingsSection>

      <SettingsSection title="Retry after payment issue" description="How long customers wait before buying again after reporting a payment issue.">
        <ChoiceButtons values={[15, 30, 45, 60]} value={timers.retryMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.retryMinutes = value))} />
      </SettingsSection>

      <SettingsSection title="Chat clean-up" description="Old chats and screenshots are deleted after this many days.">
        <ChoiceButtons values={[7, 15, 30]} value={retentionDays} unit="days" onChange={(value) => updateDraft((next) => (next.settings.retentionDays = value))} />
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3">
          <Button onClick={runCleanup}>Run clean-up now</Button>
          {cleanupResult && <span className="text-[12.5px] text-emerald-700 fade-in">{cleanupResult}</span>}
        </div>
      </SettingsSection>

      <SettingsSection title="Demo data" description="Restore the sample customers, orders and chats.">
        <Button variant="danger" onClick={resetDemo}>
          <RotateCcw size={14} /> Reset demo
        </Button>
      </SettingsSection>
    </>
  );
}
