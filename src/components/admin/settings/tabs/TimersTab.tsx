import DurationField from "../DurationField";
import type { SettingsTabProps } from "../Settings";
import { ChoiceButtons, SettingsSection } from "../SettingsSection";

export default function TimersTab({ draft, updateDraft }: SettingsTabProps) {
  const { timers, limits } = draft.settings;

  return (
    <>
      <SettingsSection title="Timers" description="Each timer can be set in minutes or hours. Changes apply to new orders and requests only.">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <DurationField label="Payment card timer" minutes={timers.orderMinutes} onChange={(value) => updateDraft((next) => (next.settings.timers.orderMinutes = value))} />
          <DurationField label="Chat becomes inactive after" minutes={timers.inactiveMinutes} onChange={(value) => updateDraft((next) => (next.settings.timers.inactiveMinutes = value))} />
          <DurationField label="Count cancellations made within" minutes={timers.cancelWindowMinutes} onChange={(value) => updateDraft((next) => (next.settings.timers.cancelWindowMinutes = value))} />
          <DurationField label="Pause new orders after cancellations for" minutes={timers.cancelCooldownMinutes} onChange={(value) => updateDraft((next) => (next.settings.timers.cancelCooldownMinutes = value))} />
          <DurationField label="Close a support request after no reply for" minutes={timers.issueInactiveMinutes} onChange={(value) => updateDraft((next) => (next.settings.timers.issueInactiveMinutes = value))} />
        </div>
      </SettingsSection>

      <SettingsSection title="Limits" description="How many times a customer can do something before they have to wait.">
        <div className="space-y-4">
          <div>
            <div className="text-[13px] font-medium text-zinc-700 mb-1.5">Cancellations within that time before new orders are paused</div>
            <ChoiceButtons values={[1, 2, 3, 5]} value={limits.cancelsBeforeCooldown} unit="times" onChange={(value) => updateDraft((next) => (next.settings.limits.cancelsBeforeCooldown = value))} />
          </div>
          <div>
            <div className="text-[13px] font-medium text-zinc-700 mb-1.5">Replies allowed after a payment is rejected</div>
            <ChoiceButtons values={[1, 2, 3]} value={limits.repliesAfterRejection} unit="times" onChange={(value) => updateDraft((next) => (next.settings.limits.repliesAfterRejection = value))} />
          </div>
        </div>
      </SettingsSection>
    </>
  );
}
