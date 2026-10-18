import type { SettingsTabProps } from "../Settings";
import { ChoiceButtons, SettingsSection } from "../SettingsSection";

export default function TimersTab({ draft, updateDraft }: SettingsTabProps) {
  const { timers, limits } = draft.settings;

  return (
    <>
      <SettingsSection title="Payment timer" description="After this time the bank details are hidden and the unpaid order is cancelled.">
        <ChoiceButtons values={[5, 10, 15, 20, 30]} value={timers.orderMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.orderMinutes = value))} />
      </SettingsSection>

      <SettingsSection title="Non-active chats" description="A chat moves from Active to Non-active after this much time without activity.">
        <ChoiceButtons values={[10, 15, 20, 30]} value={timers.inactiveMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.inactiveMinutes = value))} />
      </SettingsSection>

      <SettingsSection title="Cancel cooldown" description="After this many cancelled orders in a row, new orders are paused for the time below. A live countdown shows the customer when they can order again.">
        <div className="space-y-4">
          <div>
            <div className="text-[13px] font-medium text-zinc-700 mb-1.5">Cancellations allowed</div>
            <ChoiceButtons values={[1, 2, 3, 5]} value={limits.cancelsBeforeCooldown} unit="times" onChange={(value) => updateDraft((next) => (next.settings.limits.cancelsBeforeCooldown = value))} />
          </div>
          <div>
            <div className="text-[13px] font-medium text-zinc-700 mb-1.5">Pause new orders for</div>
            <ChoiceButtons values={[10, 15, 30, 60, 120]} value={timers.cancelCooldownMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.cancelCooldownMinutes = value))} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Retry after payment issue" description="How long customers wait before buying again after reporting a payment issue.">
        <ChoiceButtons values={[15, 30, 45, 60]} value={timers.retryMinutes} unit="min" onChange={(value) => updateDraft((next) => (next.settings.timers.retryMinutes = value))} />
      </SettingsSection>
    </>
  );
}
