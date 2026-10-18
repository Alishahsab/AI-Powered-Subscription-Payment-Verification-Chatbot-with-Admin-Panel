import { botMessageGroups, defaultBotMessages } from "@/lib/botMessages";
import { limits } from "@/lib/validation";
import { textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";

export default function MessagesTab({ draft, updateDraft }: SettingsTabProps) {
  const { messages } = draft.settings;

  return (
    <>
      {botMessageGroups.map((group) => (
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
