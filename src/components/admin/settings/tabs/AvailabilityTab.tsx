import { classNames } from "@/lib/format";
import { setAdminStatus } from "@/lib/store/admin";
import { useAppState } from "@/lib/store/state";
import { limits } from "@/lib/validation";
import type { AdminStatus } from "@/lib/types";
import Toggle from "../../ui/Toggle";
import { inputClass, textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";

const statuses: { status: AdminStatus; label: string; description: string; dot: string }[] = [
  { status: "active", label: "Active", description: "Codes sent in chat right away", dot: "bg-emerald-500" },
  { status: "away", label: "Temporarily away", description: "Code sent later, also by email", dot: "bg-amber-400" },
  { status: "offline", label: "Offline", description: "Buying paused, support open", dot: "bg-zinc-400" },
];

const messageLabels: Record<AdminStatus, string> = {
  active: "When active (after payment)",
  away: "When away (after payment)",
  offline: "When offline (on Buy)",
};

export default function AvailabilityTab({ draft, updateDraft }: SettingsTabProps) {
  const state = useAppState();
  const { hours, statusMessages } = draft.settings;

  return (
    <>
      <SettingsSection title="Your status" description="Switches instantly. Also available in the top bar.">
        <div className="grid sm:grid-cols-3 gap-2">
          {statuses.map((item) => (
            <button
              key={item.status}
              type="button"
              onClick={() => setAdminStatus(item.status)}
              className={classNames(
                "rounded-xl border p-3.5 text-left transition",
                state.settings.status === item.status ? "border-[#0C2660] ring-4 ring-[#0C2660]/10" : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                <span className={`size-2 rounded-full ${item.dot}`} />
                {item.label}
              </div>
              <div className="text-[12.5px] text-zinc-500 mt-1">{item.description}</div>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Working hours" description="When subscriptions can be bought.">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Opens">
            <div className="w-36">
              <input type="time" value={hours.start} onChange={(event) => updateDraft((draft) => (draft.settings.hours.start = event.target.value))} className={inputClass} />
            </div>
          </Field>
          <Field label="Closes">
            <div className="w-36">
              <input type="time" value={hours.end} onChange={(event) => updateDraft((draft) => (draft.settings.hours.end = event.target.value))} className={inputClass} />
            </div>
          </Field>
          <div className="pb-2">
            <Toggle on={hours.enforce} onChange={(value) => updateDraft((draft) => (draft.settings.hours.enforce = value))} label="Go offline automatically outside these hours" />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Status messages" description="What the customer sees. Use {hours} and {timer} as placeholders.">
        <div className="space-y-4">
          {(Object.keys(messageLabels) as AdminStatus[]).map((status) => (
            <Field key={status} label={messageLabels[status]}>
              <textarea rows={2} maxLength={limits.longTextMax} value={statusMessages[status]} onChange={(event) => updateDraft((draft) => (draft.settings.statusMessages[status] = event.target.value))} className={textareaClass} />
            </Field>
          ))}
        </div>
      </SettingsSection>
    </>
  );
}
