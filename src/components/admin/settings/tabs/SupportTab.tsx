import { cleanLetters, limits } from "@/lib/validation";
import { inputClass, textareaClass } from "../../ui/styles";
import type { SettingsTabProps } from "../Settings";
import { Field, SettingsSection } from "../SettingsSection";
import FaqsSection from "./FaqsSection";

export default function SupportTab({ draft, updateDraft }: SettingsTabProps) {
  const { settings } = draft;

  return (
    <>
      <SettingsSection title="Welcome" description="The first thing customers see when they open the chat.">
        <div className="space-y-4">
          <Field label="Store name">
            <input value={settings.storeName} onChange={(event) => updateDraft((next) => (next.settings.storeName = cleanLetters(event.target.value)))} className={inputClass} />
          </Field>
          <Field label="Welcome message">
            <textarea rows={2} maxLength={limits.longTextMax} value={settings.welcome} onChange={(event) => updateDraft((next) => (next.settings.welcome = event.target.value))} className={textareaClass} />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection title="Terms & conditions" description="Shown before every order. One rule per line. Use {timer} for the payment timer.">
        <textarea rows={4} maxLength={limits.longTextMax} value={settings.terms.join("\n")} onChange={(event) => updateDraft((next) => (next.settings.terms = event.target.value.split("\n")))} className={textareaClass} />
      </SettingsSection>

      <FaqsSection draft={draft} updateDraft={updateDraft} />
    </>
  );
}
