import { botMessageGroups, defaultBotMessages, type MessageTab } from "@/lib/botMessages";
import type { AdminStatus } from "@/lib/types";
import { limits } from "@/lib/validation";
import { textareaClass } from "../ui/styles";
import type { SettingsTabProps } from "./Settings";
import { Field, SettingsSection } from "./SettingsSection";

const orderMessageLabels: Record<AdminStatus, string> = {
  active: "Active: after the payment screenshot is sent",
  away: "Away (accepting): after the payment screenshot is sent",
  away_closed: "Away (not accepting): when the customer taps Buy",
  offline: "Offline: when the customer taps Buy",
};

const closedSupportLabels: Record<Exclude<AdminStatus, "active">, string> = {
  away: "Away (accepting): when the customer taps Other issues",
  away_closed: "Away (not accepting): when the customer taps Other issues",
  offline: "Offline: when the customer taps Other issues",
};

export function OrderMessagesSection({ draft, updateDraft }: SettingsTabProps) {
  const { statusMessages } = draft.settings;

  return (
    <SettingsSection title="Order messages" description="What the customer sees when buying, for each status. Use {hours}, {back_in} (time until you open) and {timer} as placeholders.">
      <div className="space-y-4">
        {(Object.keys(orderMessageLabels) as AdminStatus[]).map((status) => (
          <Field key={status} label={orderMessageLabels[status]}>
            <textarea rows={2} maxLength={limits.longTextMax} value={statusMessages[status]} onChange={(event) => updateDraft((next) => (next.settings.statusMessages[status] = event.target.value))} className={textareaClass} />
          </Field>
        ))}
      </div>
    </SettingsSection>
  );
}

export function SupportMessagesSection({ draft, updateDraft }: SettingsTabProps) {
  const { supportMessages, supportClosedMessages } = draft.settings;

  return (
    <SettingsSection title="Support messages" description="New support requests (Other issues) are only taken while you are Active. Common questions stay open in every status.">
      <div className="space-y-4">
        <Field label="Active: after a support request is sent" hint="Use {ticket_id} for the request number">
          <textarea rows={2} maxLength={limits.longTextMax} value={supportMessages.active} onChange={(event) => updateDraft((next) => (next.settings.supportMessages.active = event.target.value))} className={textareaClass} />
        </Field>
        {(Object.keys(closedSupportLabels) as (keyof typeof closedSupportLabels)[]).map((status) => (
          <Field key={status} label={closedSupportLabels[status]}>
            <textarea rows={2} maxLength={limits.longTextMax} value={supportClosedMessages[status]} onChange={(event) => updateDraft((next) => (next.settings.supportClosedMessages[status] = event.target.value))} className={textareaClass} />
          </Field>
        ))}
      </div>
    </SettingsSection>
  );
}

export function TermsSection({ draft, updateDraft }: SettingsTabProps) {
  return (
    <SettingsSection title="Terms & conditions" description="Shown before every order. One rule per line. Use {timer} for the payment timer.">
      <textarea rows={4} maxLength={limits.longTextMax} value={draft.settings.terms.join("\n")} onChange={(event) => updateDraft((next) => (next.settings.terms = event.target.value.split("\n")))} className={textareaClass} />
    </SettingsSection>
  );
}

export function BotMessageSections({ tab, draft, updateDraft }: SettingsTabProps & { tab: MessageTab }) {
  const { messages } = draft.settings;

  return (
    <>
      {botMessageGroups
        .filter((group) => group.tab === tab)
        .map((group) => (
          <SettingsSection key={group.title} title={group.title} description="Every message can use {timer}, {hours} and {back_in}.">
            <div className="space-y-4">
              {group.fields.map((field) => (
                <Field key={field.key} label={field.label} hint={field.variables}>
                  <textarea
                    rows={2}
                    maxLength={limits.longTextMax}
                    value={messages[field.key]}
                    placeholder={defaultBotMessages[field.key]}
                    onChange={(event) => updateDraft((next) => (next.settings.messages[field.key] = event.target.value))}
                    className={textareaClass}
                  />
                </Field>
              ))}
            </div>
          </SettingsSection>
        ))}
    </>
  );
}
