import { inputClass, textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";

export default function MessagesTab({ draft, updateDraft }: SettingsTabProps) {
  const { settings } = draft;

  return (
    <SettingsSection title="Chat messages" description="Everything the chatbot says. Use {timer} for the payment timer.">
      <div className="space-y-4">
        <Field label="Store name">
          <input value={settings.storeName} onChange={(event) => updateDraft((next) => (next.settings.storeName = event.target.value))} className={inputClass} />
        </Field>
        <Field label="Welcome message">
          <textarea rows={2} value={settings.welcome} onChange={(event) => updateDraft((next) => (next.settings.welcome = event.target.value))} className={textareaClass} />
        </Field>
        <Field label="Terms & conditions" hint="One per line">
          <textarea rows={3} value={settings.terms.join("\n")} onChange={(event) => updateDraft((next) => (next.settings.terms = event.target.value.split("\n")))} className={textareaClass} />
        </Field>
        <Field label="How does it work? answer">
          <textarea rows={5} value={settings.howItWorks} onChange={(event) => updateDraft((next) => (next.settings.howItWorks = event.target.value))} className={textareaClass} />
        </Field>
      </div>
    </SettingsSection>
  );
}
