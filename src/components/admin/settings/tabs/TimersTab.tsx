import type { SettingsTabProps } from "../Settings";
import { ChoiceButtons, SettingsSection } from "../SettingsSection";

export default function TimersTab({ draft, updateDraft }: SettingsTabProps) {
  const { timers } = draft.settings;

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
    </>
  );
}
